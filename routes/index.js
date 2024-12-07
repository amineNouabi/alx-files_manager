import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

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
};

export default bindRoutes;
