import jwt from "jsonwebtoken";
import { User } from "../models/User.schema";

// mengambil session
export const session = async (event: any) => {
    // mengambil token dari cookie
    const token = getCookie(event, 'auth_token');

    // jika token tidak ada
    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    // mengambil JWT Secret dari environment variable
    const secretAuthKey = process.env.JWT_SECRET;

    // jika JWT Secret tidak ada
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    try {
        // memverifikasi token
        const decodedToken = jwt.verify(token, secretAuthKey as string) as any;

        // mengambil user berdasarkan id yang sudah decode dari token
        const user = await User.findById(decodedToken.userId);

        // mengembalikan user
        return {
            id: user?._id.toString(),
            username: user?.username,
            photo: user?.photo,
            email: user?.email,
            bio: user?.bio,
        }
    } catch (error) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }
}