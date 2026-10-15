import { v2 as cloudinary } from "cloudinary";
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});
export function createPrivateDeliveryUrl(publicId:string){return cloudinary.url(publicId,{secure:true,sign_url:true,type:"authenticated",expires_at:Math.floor(Date.now()/1000)+300,resource_type:"raw"});}
export default cloudinary;