import { AdminInterface } from './../../interface/AdminInterface';
import { PrismaClient } from "../../generated/prisma";



const prisma = new PrismaClient()


const getAdminIdByToken = async (request: any, jwt: any) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader.split(' ')[1]
    const payload = await jwt.verify(token)
    return payload.id
}


export const AdminController = {
    create: async ({ body }: { body: AdminInterface}) => {
        try {
            const admin = await prisma.admin.create({
                data: body,
            })
            return admin
        } catch (error) {
            return { error: error }
        }
    },
    signin: async ({
        body,
        jwt
    }: {
        body: {
            username: string
            password: string
        }
        jwt: any
    }) => {
        try {
            const admin  = await prisma.admin.findUnique({
                where: {
                    username: body.username,
                    password: body.password,
                    status: 'active'
                },
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            })
            if (!admin) {
                return new Response('User Not Fond', {status: 404})
            }
            
            const token = await jwt.sign(admin)
            return {
                token: token,
                role: admin.role
            }
        } catch (error) {
            return { error: error }
        }
    },
    info: async ({
        request,
        jwt
    }: {
        request: {
            headers: any
        }
        jwt: any
    }) => {
        try {
            const token = request.headers.get('Authorization').split(' ')[1]
            const payload = await jwt.verify(token)
            const admin = await prisma.admin.findUnique({
                where: {
                    id: payload.id
                },
                select: {
                    name: true,
                    role: true,
                    username: true
                }
            })

            return admin
        } catch (error) {
            return { error: error }
        }
    },
    update: async ({ body, jwt, request }: {
        body: AdminInterface
        jwt: any
        request: any
    }) => {
        try {
            const adminId = await getAdminIdByToken(request, jwt)
            const oldAdmin = await prisma.admin.findUnique({
                where: {
                    id: adminId
                }
            })
            await prisma.admin.update({
                data: {
                    name: body.name,
                    username: body.username,
                    password: body.password && body.password.trim() !== '' ? body.password : oldAdmin?.password
                },
                where: {
                    id: adminId
                }
            })
            return {message: 'Admin updated successfully'}
        } catch (error) {
            return { error: error}
        }
    },
    list: async () => {
        try {
            const admins = await prisma.admin.findMany({
                select: {
                    id: true,
                    name: true,
                    username: true,
                    role: true,
                    status: true
                },
                orderBy: {
                    name: 'asc'
                },
                where: {
                    status: 'active'
                }
            })
            return admins
        } catch (error) {
            return { error: error}
        }
    },
    updateData: async ({ params, body}: {
        params: {
            id: string
        },
        body: AdminInterface
    }) => {
        try {
            const admin = await prisma.admin.findUnique({
                where: {
                    id: params.id
                }
            })
            if (!admin) {
                return { message: 'Admin not found'}
            }
            await prisma.admin.update({
                data: body,
                where: {
                    id: params.id
                }
            })
            return { message: 'Admin updated successfully'}
            
        } catch (error) {
            return { error: error}
        }
    },
    remove: async ({ params }: {
        params: {
            id: string
        }
    }) => {
        try {
            await prisma.admin.update({
                data: {
                    status: 'inactive'
                },
                where: {
                    id: params.id
                }
            })
            return { message: 'Admin deleted successfully'}
        } catch (error) {
            return { error: error}
        }
    }
}