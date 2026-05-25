import jwt from "jsonwebtoken";
import { User } from "../models/User.schema";

export const session = async (event: any) => {
    const token = getCookie(event, 'auth_token');
    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const secretAuthKey = process.env.JWT_SECRET;
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    try {
        const decodedToken = jwt.verify(token, secretAuthKey as string) as any;
        const user = await User.findById(decodedToken.userId);
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