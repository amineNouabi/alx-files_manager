import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';

import bindUser from '../middlewares/bindUser';
import restrictAuth from '../middlewares/restrictAuth';

/**
* @function bindRoutes - Bind routes to the Express app
 * @param {Express} [app] Express instance
*/
const bindRoutes = (app) => {
/**
 *
*/
  app.use(bindUser);
  /**
   * App routes
  */
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  /**
   * Users routes
  */
  app.post('/users', UsersController.postNew);
  app.get('/users/me', restrictAuth, UsersController.getMe);

  /**
  * Auth routes
  */
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);

  /**
  * Files routes
  */
  app.post('/files', restrictAuth, FilesController.postUpload);
  app.get('/files/:id', restrictAuth, FilesController.getShow);
  app.get('/files', restrictAuth, FilesController.getIndex);
  app.put('/files/:id/publish', restrictAuth, FilesController.putPublish);
  app.put('/files/:id/unpublish', restrictAuth, FilesController.putUnpublish);
  app.get('/files/:id/data', FilesController.getFile);
};

export default bindRoutes;
