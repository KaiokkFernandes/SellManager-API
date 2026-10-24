import { Router } from 'express';
import { validate } from '@shared/http/middlewares/validate';
import { updateProfileBodySchema } from './users.schemas';
import isAuthenticated from '../middlewares/isAuthenticated';
import ProfileController from '../controllers/ProfileController';

const profileRoutes = Router();
const profileController = new ProfileController();

profileRoutes.use(isAuthenticated);

profileRoutes.get('/', profileController.show.bind(profileController));

profileRoutes.put(
  '/',
  validate({ body: updateProfileBodySchema }),
  profileController.update.bind(profileController),
);

export default profileRoutes;
