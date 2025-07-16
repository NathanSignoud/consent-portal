// routes/calendar.routes.ts
import express from 'express';
import User from '../models/User'; // adapte le chemin selon ton arborescence
const router = express.Router();

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

export default router;