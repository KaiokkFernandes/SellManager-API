import CustomerRouter from '@modules/customers/routes/costumer.routes';
import productRouter from '@modules/product/routes/products.routes';
import passwordRoutes from '@modules/users/routes/password.routes';
import profileRoutes from '@modules/users/routes/profile.routes';
import sessionsRouter from '@modules/users/routes/session.routes';
import UsersRouter from '@modules/users/routes/users.routes';
import { Router } from 'express';

const routes = Router();

routes.use('/products', productRouter);
routes.use('/users', UsersRouter);
routes.use('/sessions', sessionsRouter);
routes.use('/password', passwordRoutes);
routes.use('/profile', profileRoutes);
routes.use('/customers', CustomerRouter);

export default routes;
