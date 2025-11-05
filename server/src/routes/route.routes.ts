import { Router } from 'express';
import { RouteController } from '../controllers/route.controller.js';

const router = Router();
const routeController = new RouteController();

// Network endpoints
router.get('/network', routeController.getNetwork);
router.post('/network/nodes', routeController.addNode);
router.post('/network/edges', routeController.addEdge);
router.delete('/network/nodes/:id', routeController.removeNode);
router.delete('/network/edges/:id', routeController.removeEdge);

// Route optimization endpoints
router.post('/routes/optimize', routeController.optimizeRoute);
router.post('/routes/pareto', routeController.generatePareto);
router.post('/routes/scenario', routeController.optimizeScenario);
router.post('/routes/reoptimize', routeController.reoptimizeRoute);

// Real-time data endpoints
router.get('/incidents', routeController.getIncidents);

export default router;
