// routes/calendar.routes.ts
import express from 'express';
import User from '../models/User';
import axios from 'axios';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// GET: Liste des tâches d’un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(user.calendarTasks);
  } catch (err) {
    console.error("Erreur GET calendrier :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST: Ajouter une tâche
router.post('/:userId', async (req, res) => {
  const { title, date } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Titre et date requis' });

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    user.calendarTasks.push({ title, date, completed: false });
    await user.save();

    res.json(user.calendarTasks);
  } catch (err) {
    console.error("Erreur POST calendrier :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE: Supprimer une tâche
router.delete('/:userId/:taskId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    user.calendarTasks = user.calendarTasks.filter(
      (task: any) => task._id.toString() !== req.params.taskId
    );

    await user.save();
    res.json(user.calendarTasks);
  } catch (err) {
    console.error("Erreur DELETE calendrier :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH: Marquer une tâche comme effectuée / non effectuée
router.patch('/:userId/:taskId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const task = user.calendarTasks.find(
      (t: any) => t._id.toString() === req.params.taskId
    );
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });

    task.completed = !task.completed;
    await user.save();

    res.json(user.calendarTasks);
  } catch (err) {
    console.error("Erreur PATCH calendrier :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/travel-time', async (req, res) => {
  const { from, to } = req.body; // from et to sont des tableaux [lon, lat]

  if (!from || !to || from.length !== 2 || to.length !== 2) {
    return res.status(400).json({ error: 'Coordonnées from et to requises sous forme [lon, lat]' });
  }

  try {
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        coordinates: [from, to]
      },
      {
        headers: {
          Authorization: process.env.OPENROUTESERVICE_API_KEY || '',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data as any;
    const summary = data.routes[0].summary;

    res.json({
      distance_km: (summary.distance / 1000).toFixed(2),
      duration_min: Math.round(summary.duration / 60)
    });
  } catch (error) {
    console.error('Erreur OpenRouteService:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du trajet' });
  }
});

export default router;