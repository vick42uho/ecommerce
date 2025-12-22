import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import jwt from '@elysiajs/jwt';
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { AdminController } from "./controllers/AdminController";
import { ProductController } from "./controllers/ProductController";
import { MemberController } from "./controllers/MemberController";
import { CartController } from "./controllers/CartController";
import { OrderController } from "./controllers/OrderController";
import { DashboardController } from "./controllers/DashboardController";

// middleware
const checkSignIn = async ( {jwt, request, set}: any ) => {
  const token = request.headers.get('Authorization').split(' ')[1];

  if (!token) {
    set.status = 401
    return 'Unauthorized'
  }

  const payload = await jwt.verify(token, 'secret')

  if (!payload) {
    set.status = 401
    return 'Unauthorized'
  }
}


const app = new Elysia()
.use(cors())
.use(swagger())
.use(
  staticPlugin({
    assets: './uploads',
    prefix: '/uploads'
  })
)

.use(
  jwt({
    name: 'jwt',
    secret: 'wickwub'
  })
)

.group('/api/dashboard', app => app
  .get('/', DashboardController.summary, {beforeHandle: checkSignIn})
  .get('/monthly-sales/:year', DashboardController.monthlySales)
)

// Admin
.group('/api/admin', app => app
  .post('/create', AdminController.create)
  .post('/signin', AdminController.signin)
  .get('/info', AdminController.info)
  .put('/update', AdminController.update)
  .get('/list', AdminController.list)
  .put('/update-data/:id', AdminController.updateData)
  .delete('/remove/:id', AdminController.remove)
)

// Member
.group('/api/member', app => app
  .post('/sign-up', MemberController.signup)
  .post('/sign-in', MemberController.signin)
  .get('/info', MemberController.info)
  .get('/history', MemberController.history)
)

// Product
.group('/api/product', app => app
  .get('/list', ProductController.list)
  .post('/create', ProductController.create)
  .put('/update/:id', ProductController.update)
  .delete('/remove/:id', ProductController.remove)
  .get('/search', ProductController.search)
  .get('/categories', ProductController.getCategories)
  .get('/popular', ProductController.getPopularProducts)
  .put('/view/:id', ProductController.updateViewCount)
  .delete('/remove-image/:id/:imageName', ProductController.removeImage)
)

// Cart
.group('/api/cart', app => app
  .post('/add', CartController.add)
  .put('/update', CartController.update)
  .get('/list/:memberId', CartController.list)
  .delete('/remove/:id', CartController.remove)
  .post('/confirm', CartController.cartConfirm)
  .post('/uploadSlip', CartController.uploadSlip)
  .post('/confirmOrder', CartController.confirmOrder)
  .put('/confirm-received/:orderId', CartController.confirmReceived)
)

// Order
.group('/api/order', app => app
  .get('/list', OrderController.list)
  .put('/send', OrderController.send)
  .put('/paid/:id', OrderController.paid)
  .put('/cancel/:id', OrderController.cancel)
)




.get("/", () => "Hello Elysia")


.listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
