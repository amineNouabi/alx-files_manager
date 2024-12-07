import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';

import restrictAuth from '../middlewares/restrict';

/**
* @function bindRoutes - Bind routes to the Express app
 * @param {Express} [app] Express instance
*/
const bindRoutes = (app) => {
  /**
   * App routes
  */
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  /**
   * Users routes
  */
  app.post('/users', UsersController.postNew);

  /**
  * Auth routes
  */
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);

  app.use(restrictAuth);
  app.get('/users/me', restrictAuth, UsersController.getMe);
};

export default bindRoutes;
