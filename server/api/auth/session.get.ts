import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    const auth = await session(event);
    return auth;
})