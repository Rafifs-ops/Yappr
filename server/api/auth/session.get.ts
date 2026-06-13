import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    //Mengambil session
    const auth = await session(event);
    return auth;
})