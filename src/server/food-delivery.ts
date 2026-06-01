import { db } from "./mongoauth";

const collection = await db.collection('foods');
const documents = await collection.find().toArray()

export interface FoodItem {
  foodname: string;
  hotelname: string;
  latitude: number;
  longitude: number;
  price: number;
  image_url?: string;
}

const getFoodishImageUrl = (): string => {
  const images = ['food1.png', 'food2.png', 'food3.png','food4.png','foodie.png'];
  const index = Math.floor(Math.random() * 4);
  return images[index];
};



const food: any = documents;

for (const item of food) {
  item.foodname.split(' ')[item.foodname.split(' ').length-1] === 'Chai' || item.foodname.split(' ')[item.foodname.split(' ').length-1] === 'Tea' ? item.image_url = "tea.png" : item.image_url = getFoodishImageUrl();
}

export const foodItems = food;