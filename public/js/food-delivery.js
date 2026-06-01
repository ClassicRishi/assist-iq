(function () {
  if (window.__assistFoodDeliveryInit) {
    return;
  }
  window.__assistFoodDeliveryInit = true;

  const PLACEHOLDER_IMAGE =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
        '<rect fill="#0a120e" width="400" height="300"/>' +
        '<text x="200" y="155" fill="#4ade80" font-family="sans-serif" font-size="18" text-anchor="middle">Food Image</text>' +
        '</svg>',
    );

  const searchInput = document.getElementById('foodSearch');
  const autocompleteEl = document.getElementById('foodAutocomplete');
  const gridEl = document.getElementById('foodGrid');
  const resultCountEl = document.getElementById('foodResultCount');
  const detailPanel = document.getElementById('foodDetail');
  const detailImage = document.getElementById('foodDetailImage');
  const detailName = document.getElementById('foodDetailName');
  const detailHotel = document.getElementById('foodDetailHotel');
  const detailPrice = document.getElementById('foodDetailPrice');
  const btnCloseDetail = document.getElementById('btnCloseDetail');
  const btnOrderFood = document.getElementById('btnOrderFood');
  const dataEl = document.getElementById('foodItemsData');
  
  // Hidden form inputs
  const foodDetailNameInput = document.getElementById('foodDetailNameInput');
  const foodDetailHotelInput = document.getElementById('foodDetailHotelInput');
  const foodDetailPriceInput = document.getElementById('foodDetailPriceInput');
  const foodDetailLatInput = document.getElementById('foodDetailLatInput');
  const foodDetailLngInput = document.getElementById('foodDetailLngInput');
  const foodDetailImageInput = document.getElementById('foodDetailImageInput');
  const filterChips = document.querySelectorAll('.food-filter-chip');

  // Cart elements
  const btnCartToggle = document.getElementById('btnCartToggle');
  const cartCountEl = document.getElementById('cartCount');
  const cartPanel = document.getElementById('cartPanel');
  const btnCloseCart = document.getElementById('btnCloseCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartTotalEl = document.getElementById('cartTotal');
  const btnCheckout = document.getElementById('btnCheckout');
  const btnQtyMinus = document.getElementById('btnQtyMinus');
  const btnQtyPlus = document.getElementById('btnQtyPlus');
  const foodQuantityInput = document.getElementById('foodQuantity');

  // Map modal elements
  const mapModal = document.getElementById('mapModal');
  const btnCloseMap = document.getElementById('btnCloseMap');
  const btnConfirmOrder = document.getElementById('btnConfirmOrder');
  const userLocationText = document.getElementById('userLocationText');
  const hotelLocationText = document.getElementById('hotelLocationText');
  const distanceText = document.getElementById('distanceText');

  if (!searchInput || !gridEl || !dataEl) {
    return;
  }

  let foods = [];
  let filteredFoods = [];
  let activeFilter = 'all';
  let selectedIndex = -1;
  let autocompleteItems = [];
  let selectedFood = null;

  // Cart state
  let cart = [];
  const CART_STORAGE_KEY = 'assistiq_food_cart';

  // Map state
  let deliveryMap = null;
  let userMarker = null;
  let hotelMarkers = [];
  let routesLayer = null;
  let userLocation = null;

  try {
    foods = JSON.parse(dataEl.textContent || '[]');
  } catch {
    foods = [];
  }

  // Load cart from localStorage
  function loadCart() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        cart = JSON.parse(saved);
        if (!Array.isArray(cart)) cart = [];
      }
    } catch {
      cart = [];
    }
  }

  // Save cart to localStorage
  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage might be full or unavailable
    }
  }

  // Get cart key for a food item
  function getCartKey(item) {
    return item._id || item.foodname + '|' + item.hotelname;
  }

  // Find item in cart by key
  function findInCart(key) {
    return cart.findIndex(function(i) { return i.key === key; });
  }

  // Add item to cart
  function addToCart(item, quantity) {
    const key = getCartKey(item);
    const existingIndex = findInCart(key);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        key: key,
        id: item._id || key,
        foodname: item.foodname,
        hotelname: item.hotelname,
        price: item.price,
        latitude: item.latitude,
        longitude: item.longitude,
        image_url: item.image_url || '',
        quantity: quantity
      });
    }

    saveCart();
    updateCartUI();
  }

  // Remove item from cart
  function removeFromCart(key) {
    const index = findInCart(key);
    if (index >= 0) {
      cart.splice(index, 1);
      saveCart();
      updateCartUI();
    }
  }

  // Update item quantity in cart
  function updateCartQuantity(key, newQty) {
    const index = findInCart(key);
    if (index >= 0) {
      if (newQty <= 0) {
        removeFromCart(key);
      } else {
        cart[index].quantity = newQty;
        saveCart();
        updateCartUI();
      }
    }
  }

  // Get total items in cart
  function getCartItemCount() {
    return cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
  }

  // Get total price
  function getCartTotal() {
    return cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
  }

  // Update cart UI
  function updateCartUI() {
    // Update cart count badge
    const count = getCartItemCount();
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.setAttribute('data-count', count);
    }

    // Update cart panel
    if (cartItemsEl && cartEmptyEl && cartTotalEl) {
      cartItemsEl.innerHTML = '';

      if (cart.length === 0) {
        cartItemsEl.style.display = 'none';
        cartEmptyEl.hidden = false;
      } else {
        cartItemsEl.style.display = 'flex';
        cartEmptyEl.hidden = true;

        cart.forEach(function(item) {
          const itemEl = document.createElement('div');
          itemEl.className = 'cart-item';

          const img = document.createElement('img');
          img.className = 'cart-item-image';
          img.src = item.image_url || PLACEHOLDER_IMAGE;
          img.alt = item.foodname;
          img.onerror = function() { img.src = PLACEHOLDER_IMAGE; };

          const details = document.createElement('div');
          details.className = 'cart-item-details';

          const name = document.createElement('div');
          name.className = 'cart-item-name';
          name.textContent = item.foodname;

          const hotel = document.createElement('div');
          hotel.className = 'cart-item-hotel';
          hotel.textContent = item.hotelname;

          const price = document.createElement('div');
          price.className = 'cart-item-price';
          price.textContent = formatPrice(item.price * item.quantity);

          details.appendChild(name);
          details.appendChild(hotel);
          details.appendChild(price);

          const controls = document.createElement('div');
          controls.className = 'cart-item-controls';

          const minusBtn = document.createElement('button');
          minusBtn.type = 'button';
          minusBtn.className = 'cart-qty-btn';
          minusBtn.textContent = '−';
          minusBtn.setAttribute('aria-label', 'Decrease quantity');
          minusBtn.addEventListener('click', function() {
            updateCartQuantity(item.key, item.quantity - 1);
          });

          const qtySpan = document.createElement('span');
          qtySpan.className = 'cart-item-qty';
          qtySpan.textContent = item.quantity;

          const plusBtn = document.createElement('button');
          plusBtn.type = 'button';
          plusBtn.className = 'cart-qty-btn';
          plusBtn.textContent = '+';
          plusBtn.setAttribute('aria-label', 'Increase quantity');
          plusBtn.addEventListener('click', function() {
            updateCartQuantity(item.key, item.quantity + 1);
          });

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'cart-item-remove';
          removeBtn.textContent = '×';
          removeBtn.setAttribute('aria-label', 'Remove item');
          removeBtn.addEventListener('click', function() {
            removeFromCart(item.key);
          });

          controls.appendChild(minusBtn);
          controls.appendChild(qtySpan);
          controls.appendChild(plusBtn);
          controls.appendChild(removeBtn);

          itemEl.appendChild(img);
          itemEl.appendChild(details);
          itemEl.appendChild(controls);

          cartItemsEl.appendChild(itemEl);
        });
      }

      cartTotalEl.textContent = formatPrice(getCartTotal());
    }
  }

  // Toggle cart panel
  function toggleCartPanel() {
    if (cartPanel) {
      const isHidden = cartPanel.hidden;
      cartPanel.hidden = !isHidden;
      if (!isHidden) {
        closeDetail();
      }
    }
  }

  function closeCartPanel() {
    if (cartPanel) {
      cartPanel.hidden = true;
    }
  }

  // Check if item is already in cart
  function isInCart(item) {
    return findInCart(getCartKey(item)) >= 0;
  }

  // Get current quantity of item in cart
  function getCartItemQuantity(item) {
    const index = findInCart(getCartKey(item));
    return index >= 0 ? cart[index].quantity : 0;
  }

  function foodKey(item) {
    return item.foodname.toLowerCase().replace(/\s+/g, '-') + '-' + item.hotelname.toLowerCase().slice(0, 12);
  }

  function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
  }

  function matchesPriceFilter(price, filter) {
    if (filter === 'budget') {
      return price < 200;
    }
    if (filter === 'mid') {
      return price >= 200 && price <= 500;
    }
    if (filter === 'premium') {
      return price > 500;
    }
    return true;
  }

  function normalizeQuery(value) {
    return value.trim().toLowerCase();
  }

  function itemMatchesQuery(item, query) {
    if (!query) {
      return true;
    }
    const haystack = (item.foodname + ' ' + item.hotelname).toLowerCase();
    return haystack.includes(query);
  }

  function getFilteredFoods(query) {
    const normalized = normalizeQuery(query);
    return foods.filter(function (item) {
      return itemMatchesQuery(item, normalized) && matchesPriceFilter(item.price, activeFilter);
    });
  }

  function getAutocompleteSuggestions(query) {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      return [];
    }

    const matches = foods.filter(function (item) {
      return itemMatchesQuery(item, normalized);
    });

    const suggestions = [];
    const seen = new Set();

    matches.forEach(function (item) {
      const foodLabel = item.foodname;
      const hotelLabel = item.hotelname;
      const foodKeyStr = 'food:' + foodLabel.toLowerCase();
      const hotelKeyStr = 'hotel:' + hotelLabel.toLowerCase();

      if (foodLabel.toLowerCase().includes(normalized) && !seen.has(foodKeyStr)) {
        seen.add(foodKeyStr);
        suggestions.push({
          type: 'food',
          label: foodLabel,
          sublabel: hotelLabel,
          query: foodLabel,
          item: item,
        });
      }

      if (hotelLabel.toLowerCase().includes(normalized) && !seen.has(hotelKeyStr)) {
        seen.add(hotelKeyStr);
        suggestions.push({
          type: 'hotel',
          label: hotelLabel,
          sublabel: 'Restaurant',
          query: hotelLabel,
          item: item,
        });
      }
    });

    return suggestions.slice(0, 8);
  }

  function hideAutocomplete() {
    if (!autocompleteEl) {
      return;
    }
    autocompleteEl.hidden = true;
    autocompleteEl.innerHTML = '';
    searchInput.setAttribute('aria-expanded', 'false');
    autocompleteItems = [];
    selectedIndex = -1;
  }

  function renderAutocomplete(query) {
    if (!autocompleteEl) {
      return;
    }

    autocompleteItems = getAutocompleteSuggestions(query);
    autocompleteEl.innerHTML = '';
    selectedIndex = -1;

    if (!autocompleteItems.length || !normalizeQuery(query)) {
      hideAutocomplete();
      return;
    }

    autocompleteItems.forEach(function (suggestion, index) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'food-autocomplete-item';
      btn.setAttribute('role', 'option');
      btn.dataset.index = String(index);

      const title = document.createElement('strong');
      title.textContent = suggestion.label;

      const sub = document.createElement('span');
      sub.textContent = suggestion.sublabel;

      btn.appendChild(title);
      btn.appendChild(sub);

      btn.addEventListener('mousedown', function (event) {
        event.preventDefault();
        applyAutocompleteSelection(suggestion);
      });

      li.appendChild(btn);
      autocompleteEl.appendChild(li);
    });

    autocompleteEl.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  }

  function highlightAutocomplete(index) {
    if (!autocompleteEl) {
      return;
    }

    const buttons = autocompleteEl.querySelectorAll('.food-autocomplete-item');
    buttons.forEach(function (btn, i) {
      btn.classList.toggle('is-active', i === index);
    });
  }

  function applyAutocompleteSelection(suggestion) {
    searchInput.value = suggestion.query;
    hideAutocomplete();
    filteredFoods = getFilteredFoods(suggestion.query);
    renderGrid();
    if (suggestion.item) {
      openDetail(suggestion.item);
    }
  }

  function renderGrid() {
    gridEl.innerHTML = '';

    if (!filteredFoods.length) {
      const empty = document.createElement('div');
      empty.className = 'food-empty';
      empty.textContent = 'No dishes match your search. Try another name or hotel.';
      gridEl.appendChild(empty);
      resultCountEl.textContent = 'No results';
      return;
    }

    resultCountEl.textContent =
      filteredFoods.length === 1
        ? 'Showing 1 dish'
        : 'Showing ' + filteredFoods.length + ' dishes';

    filteredFoods.forEach(function (item) {
      const key = foodKey(item);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'food-card' + (selectedFood && foodKey(selectedFood) === key ? ' is-selected' : '');
      card.dataset.foodKey = key;

      const imageWrap = document.createElement('div');
      imageWrap.className = 'food-card-image-wrap';

      const img = document.createElement('img');
      img.className = 'food-card-image';
      img.src = item.image_url || PLACEHOLDER_IMAGE;
      img.alt = item.foodname;
      img.loading = 'lazy';
      img.addEventListener('error', function () {
        img.src = PLACEHOLDER_IMAGE;
      });

      const priceBadge = document.createElement('span');
      priceBadge.className = 'food-card-price';
      priceBadge.textContent = formatPrice(item.price);

      imageWrap.appendChild(img);
      imageWrap.appendChild(priceBadge);

      const body = document.createElement('div');
      body.className = 'food-card-body';

      const name = document.createElement('div');
      name.className = 'food-card-name';
      name.textContent = item.foodname;

      const hotel = document.createElement('div');
      hotel.className = 'food-card-hotel';
      hotel.textContent = item.hotelname;

      body.appendChild(name);
      body.appendChild(hotel);

      card.appendChild(imageWrap);
      card.appendChild(body);

      card.addEventListener('click', function () {
        openDetail(item);
      });

      gridEl.appendChild(card);
    });
  }

  function openDetail(item) {
    selectedFood = item;

    if (detailImage && detailName && detailHotel && detailPrice) {
      detailImage.src = item.image_url || PLACEHOLDER_IMAGE;
      detailImage.alt = item.foodname;
      detailImage.onerror = function() {
        detailImage.src = PLACEHOLDER_IMAGE;
      };
      detailName.textContent = item.foodname;
      detailHotel.textContent = item.hotelname;
      detailPrice.textContent = formatPrice(item.price);

      // Update hidden form inputs
      if (foodDetailNameInput) foodDetailNameInput.value = item.foodname;
      if (foodDetailHotelInput) foodDetailHotelInput.value = item.hotelname;
      if (foodDetailPriceInput) foodDetailPriceInput.value = item.price;
      if (foodDetailLatInput) foodDetailLatInput.value = item.latitude || '';
      if (foodDetailLngInput) foodDetailLngInput.value = item.longitude || '';
      if (foodDetailImageInput) foodDetailImageInput.value = item.image_url || '';

      // Update quantity selector
      if (foodQuantityInput) {
        const existingQty = getCartItemQuantity(item);
        if (existingQty > 0) {
          foodQuantityInput.value = existingQty;
        } else {
          foodQuantityInput.value = 1;
        }
      }

      // Update button text if already in cart
      if (btnOrderFood) {
        if (isInCart(item)) {
          btnOrderFood.textContent = 'Update Cart';
        } else {
          btnOrderFood.textContent = 'Add to Cart';
        }
      }

      detailPanel.hidden = false;
    }

    gridEl.querySelectorAll('.food-card').forEach(function(card) {
      card.classList.toggle('is-selected', card.dataset.foodKey === foodKey(item));
    });
  }

  function closeDetail() {
    selectedFood = null;
    if (detailPanel) {
      detailPanel.hidden = true;
    }
    gridEl.querySelectorAll('.food-card.is-selected').forEach(function (card) {
      card.classList.remove('is-selected');
    });
  }

  function applySearch() {
    filteredFoods = getFilteredFoods(searchInput.value);
    renderGrid();
    renderAutocomplete(searchInput.value);
  }

  searchInput.addEventListener('input', function () {
    applySearch();
  });

  searchInput.addEventListener('focus', function () {
    renderAutocomplete(searchInput.value);
  });

  searchInput.addEventListener('keydown', function (event) {
    if (!autocompleteItems.length || autocompleteEl.hidden) {
      if (event.key === 'Escape') {
        closeDetail();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, autocompleteItems.length - 1);
      highlightAutocomplete(selectedIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightAutocomplete(selectedIndex);
      return;
    }

    if (event.key === 'Enter') {
      if (selectedIndex >= 0 && autocompleteItems[selectedIndex]) {
        event.preventDefault();
        applyAutocompleteSelection(autocompleteItems[selectedIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      hideAutocomplete();
    }
  });

  document.addEventListener('click', function (event) {
    if (
      autocompleteEl &&
      !autocompleteEl.hidden &&
      !autocompleteEl.contains(event.target) &&
      event.target !== searchInput
    ) {
      hideAutocomplete();
    }
  });

  filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filterChips.forEach(function (c) {
        c.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      activeFilter = chip.dataset.filter || 'all';
      applySearch();
    });
  });

  // Quantity selector buttons
  if (btnQtyMinus && foodQuantityInput) {
    btnQtyMinus.addEventListener('click', function() {
      const current = parseInt(foodQuantityInput.value) || 1;
      if (current > 1) {
        foodQuantityInput.value = current - 1;
      }
    });
  }

  if (btnQtyPlus && foodQuantityInput) {
    btnQtyPlus.addEventListener('click', function() {
      const current = parseInt(foodQuantityInput.value) || 1;
      if (current < 99) {
        foodQuantityInput.value = current + 1;
      }
    });
  }

  // Ensure quantity input stays in range
  if (foodQuantityInput) {
    foodQuantityInput.addEventListener('change', function() {
      let val = parseInt(foodQuantityInput.value) || 1;
      if (val < 1) val = 1;
      if (val > 99) val = 99;
      foodQuantityInput.value = val;
    });
  }

  if (btnCloseDetail) {
    btnCloseDetail.addEventListener('click', closeDetail);
  }

  // Add to Cart button now submits the form directly (no JS click handler needed)
  // The button is type="submit" and will POST to /add-to-cart

  // Cart toggle button - now just a clickable button (no JS panel toggle)
  // The cart panel functionality has been removed; button can be used for navigation or other purposes

  if (btnCloseCart) {
    btnCloseCart.addEventListener('click', closeCartPanel);
  }

  if (btnCheckout) {
    btnCheckout.addEventListener('click', function() {
      // Close cart panel and show map modal
      closeCartPanel();
      showDeliveryMap();
    });
  }

  // Show delivery map with route
  function showDeliveryMap() {
    if (mapModal) {
      mapModal.hidden = false;
    }

    // Reset UI
    if (userLocationText) userLocationText.textContent = 'Detecting your location...';
    if (hotelLocationText) hotelLocationText.textContent = '-';
    if (distanceText) distanceText.textContent = 'Calculating distance...';

    // Get user's current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (userLocationText) {
            userLocationText.textContent = userLocation.lat.toFixed(4) + ', ' + userLocation.lng.toFixed(4);
          }
          renderMap();
        },
        function(error) {
          console.error('Geolocation error:', error);
          // Default to a central location in Tirupati if geolocation fails
          userLocation = { lat: 13.6288, lng: 79.4192 };
          if (userLocationText) {
            userLocationText.textContent = 'Using default location (Tirupati)';
          }
          renderMap();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not supported
      userLocation = { lat: 13.6288, lng: 79.4192 };
      if (userLocationText) {
        userLocationText.textContent = 'Geolocation not supported, using default';
      }
      renderMap();
    }
  }

  // Render the map with route
  function renderMap() {
    if (!userLocation) return;

    // Destroy existing map
    if (deliveryMap) {
      deliveryMap.remove();
      deliveryMap = null;
    }

    const mapContainer = document.getElementById('deliveryMap');
    if (!mapContainer) return;

    // Create map
    deliveryMap = L.map('deliveryMap').setView([userLocation.lat, userLocation.lng], 13);

    // Add dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(deliveryMap);

    // Add user location marker with blinking effect
    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div class='user-marker-blink' style='background-color:#4ade80;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(74,222,128,0.6);animation:blink-marker 1.5s ease-in-out infinite;'></div>",
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(deliveryMap)
      .bindPopup('Your Location');

    // Get address for user location using reverse geocoding
    getAddressFromCoords(userLocation.lat, userLocation.lng).then(function(address) {
      if (userLocationText) {
        userLocationText.textContent = address || (userLocation.lat.toFixed(4) + ', ' + userLocation.lng.toFixed(4));
      }
    }).catch(function() {
      if (userLocationText) {
        userLocationText.textContent = userLocation.lat.toFixed(4) + ', ' + userLocation.lng.toFixed(4);
      }
    });

    // Collect unique hotel locations from ALL available restaurants (foods array)
    const hotelLocations = [];
    const seenHotels = new Set();

    foods.forEach(function(item) {
      if (item.latitude && item.longitude && !seenHotels.has(item.hotelname)) {
        seenHotels.add(item.hotelname);
        hotelLocations.push({
          name: item.hotelname,
          lat: item.latitude,
          lng: item.longitude
        });
      }
    });

    if (hotelLocations.length === 0) {
      // No hotel locations, use a default
      hotelLocations.push({
        name: 'Selected Restaurant',
        lat: 13.6288,
        lng: 79.4192
      });
    }

    // Update hotel location text
    if (hotelLocationText) {
      hotelLocationText.textContent = hotelLocations.map(function(h) { return h.name; }).join(', ');
    }

    // Add hotel markers with hotel icon and blinking effect
    const hotelIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div class='hotel-marker-blink' style='background-color:#f87171;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(248,113,113,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;animation:blink-marker 1.5s ease-in-out infinite 0.5s;'>🏨</div>",
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    hotelLocations.forEach(function(hotel) {
      const marker = L.marker([hotel.lat, hotel.lng], { icon: hotelIcon })
        .addTo(deliveryMap)
        .bindPopup('<b>🏨 ' + hotel.name + '</b>');
      hotelMarkers.push(marker);
    });

    // Calculate and display route using OSRM
    fetchRoute(userLocation, hotelLocations).then(function(routes) {
      routes.forEach(function(route) {
        if (route.latlngs && route.latlngs.length > 0) {
          const polyline = L.polyline(route.latlngs, {
            color: '#4ade80',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(deliveryMap);
          routesLayer = polyline;

          // Calculate distance
          const distance = calculateDistance(userLocation, route.destination);
          if (distanceText) {
            distanceText.textContent = 'Distance: ' + distance.toFixed(1) + ' km | Est. delivery: ' + Math.ceil(distance / 5) + '-' + Math.ceil(distance / 3) + ' mins';
          }
        }
      });

      // Fit map to show all markers
      const allPoints = [[userLocation.lat, userLocation.lng]];
      hotelLocations.forEach(function(h) {
        allPoints.push([h.lat, h.lng]);
      });
      deliveryMap.fitBounds(allPoints, { padding: [50, 50] });
    });
  }

  // Fetch route from OSRM
  function fetchRoute(start, destinations) {
    const routes = [];
    const promises = destinations.map(function(dest) {
      return fetch('https://router.project-osrm.org/route/v1/driving/' + start.lng + ',' + start.lat + ';' + dest.lng + ',' + dest.lat + '?overview=full&geometries=geojson')
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates;
            const latlngs = coordinates.map(function(coord) {
              return [coord[1], coord[0]];
            });
            routes.push({
              latlngs: latlngs,
              destination: { lat: dest.lat, lng: dest.lng }
            });
          }
        })
        .catch(function(error) {
          console.error('Route fetch error:', error);
          // Fallback to straight line
          routes.push({
            latlngs: [[start.lat, start.lng], [dest.lat, dest.lng]],
            destination: { lat: dest.lat, lng: dest.lng }
          });
        });
    });

    return Promise.all(promises).then(function() {
      return routes;
    });
  }

  // Calculate distance using Haversine formula
  function calculateDistance(start, end) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(end.lat - start.lat);
    const dLng = toRad(end.lng - start.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Get address from coordinates using reverse geocoding (Nominatim API)
  function getAddressFromCoords(lat, lng) {
    return fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data && data.display_name) {
          // Extract a shorter, more readable address
          var address = data.display_name;
          if (address.length > 80) {
            address = address.substring(0, 80) + '...';
          }
          return address;
        }
        return null;
      })
      .catch(function(error) {
        console.error('Reverse geocoding error:', error);
        return null;
      });
  }

  // Close map modal
  function closeMapModal() {
    if (mapModal) {
      mapModal.hidden = true;
    }
    if (deliveryMap) {
      deliveryMap.remove();
      deliveryMap = null;
    }
    userMarker = null;
    hotelMarkers = [];
    routesLayer = null;
  }

  // Confirm order and complete checkout
  function confirmOrder() {
    if (btnConfirmOrder) {
      btnConfirmOrder.textContent = 'Processing...';
      btnConfirmOrder.disabled = true;
    }

    setTimeout(function() {
      // Clear cart
      cart = [];
      saveCart();
      updateCartUI();
      closeMapModal();

      if (btnConfirmOrder) {
        btnConfirmOrder.textContent = 'Confirm & Place Order';
        btnConfirmOrder.disabled = false;
      }

      // Show success message
      alert('Order placed successfully! Your food will arrive soon. 🎉');
    }, 1500);
  }

  // Close cart when clicking outside
  document.addEventListener('click', function(event) {
    if (cartPanel && !cartPanel.hidden) {
      if (!cartPanel.contains(event.target) && event.target !== btnCartToggle && !btnCartToggle.contains(event.target)) {
        closeCartPanel();
      }
    }
  });

  // Close cart on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeCartPanel();
      closeMapModal();
    }
  });

  // Map modal controls
  if (btnCloseMap) {
    btnCloseMap.addEventListener('click', closeMapModal);
  }

  if (btnConfirmOrder) {
    btnConfirmOrder.addEventListener('click', confirmOrder);
  }

  // Close map modal when clicking outside content
  if (mapModal) {
    mapModal.addEventListener('click', function(event) {
      if (event.target === mapModal) {
        closeMapModal();
      }
    });
  }

  // Initialize cart
  loadCart();
  updateCartUI();

  filteredFoods = getFilteredFoods('');
  renderGrid();
})();
