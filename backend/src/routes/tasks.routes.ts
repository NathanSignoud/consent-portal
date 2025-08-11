/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import Task from '../models/Task';
import Patient2 from '../models/Patient2';

const router = express.Router();

// GET /tasks?userId=...&date=YYYY-MM-DD&completed=true/false&patientId=...
router.get('/', async (req, res) => {
  try {
    const { userId, date, completed, patientId } = req.query as { 
      userId?: string; 
      date?: string; 
      completed?: string;
      patientId?: string;
    };
    
    const q: any = {};
    if (userId) q.userId = userId;
    if (date) q.date = date;
    if (completed !== undefined) q.completed = completed === 'true';
    if (patientId) q.patientId = patientId;
    
    const tasks = await Task.find(q)
      .populate('patientId', 'nom prenom adresse') // Populate patient info
      .sort({ date: 1, createdAt: -1 })
      .lean();
      
    res.json(tasks);
  } catch (e: any) {
    console.error('[GET /tasks] error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// GET /tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('patientId', 'nom prenom adresse pathologies')
      .lean();
      
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e: any) {
    console.error('[GET /tasks/:id] error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  try {
    // Validation des champs requis
    const { icnp, date, userId } = req.body;
    
    if (!icnp?.id || !icnp?.term?.fr) {
      return res.status(400).json({ 
        error: 'ICNP data required', 
        details: 'icnp.id and icnp.term.fr are required' 
      });
    }
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'Date must be YYYY-MM-DD format' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'UserId required' 
      });
    }

    // Si patientId fourni, vérifier qu'il existe et récupérer le nom
    let patientName = req.body.patientName;
    if (req.body.patientId) {
      const patient = await Patient2.findById(req.body.patientId, 'nom prenom').lean();
      if (!patient) {
        return res.status(400).json({ error: 'Patient not found' });
      }
      patientName = `${patient.nom} ${patient.prenom}`.trim();
    }

    const taskData = {
      ...req.body,
      patientName // Override avec le nom réel du patient
    };

    const created = await Task.create(taskData);
    
    // Retourner la tâche créée avec les infos patient si applicable
    const populatedTask = await Task.findById(created._id)
      .populate('patientId', 'nom prenom adresse')
      .lean();
      
    res.status(201).json(populatedTask);
  } catch (e: any) {
    console.error('[POST /tasks] error:', e);
    res.status(400).json({ error: 'Validation error', details: e.message });
  }
});

// PATCH /tasks/:id (toggle completed / update notes, date, etc.)
router.patch('/:id', async (req, res) => {
  try {
    // Si on modifie le patientId, mettre à jour le patientName
    if (req.body.patientId) {
      const patient = await Patient2.findById(req.body.patientId, 'nom prenom').lean();
      if (patient) {
        req.body.patientName = `${patient.nom} ${patient.prenom}`.trim();
      }
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId', 'nom prenom adresse').lean();
    
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (e: any) {
    console.error('[PATCH /tasks/:id] error:', e);
    res.status(400).json({ error: 'Update error', details: e.message });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true, message: 'Task deleted successfully' });
  } catch (e: any) {
    console.error('[DELETE /tasks/:id] error:', e);
    res.status(400).json({ error: 'Delete error', details: e.message });
  }
});

// GET /tasks/user/:userId/summary - Statistiques utilisateur
router.get('/user/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query as { date?: string };
    
    const q: any = { userId };
    if (date) q.date = date;
    
    const tasks = await Task.find(q).lean();
    
    const summary = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      byDate: {} as Record<string, { total: number; completed: number; pending: number }>
    };
    
    // Grouper par date
    tasks.forEach(task => {
      if (!summary.byDate[task.date]) {
        summary.byDate[task.date] = { total: 0, completed: 0, pending: 0 };
      }
      summary.byDate[task.date].total++;
      if (task.completed) {
        summary.byDate[task.date].completed++;
      } else {
        summary.byDate[task.date].pending++;
      }
    });
    
    res.json(summary);
  } catch (e: any) {
    console.error('[GET /tasks/user/:userId/summary] error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// PATCH /tasks/:id/toggle - Toggle completed status specifically
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    task.completed = !task.completed;
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('patientId', 'nom prenom adresse')
      .lean();
      
    res.json(populatedTask);
  } catch (e: any) {
    console.error('[PATCH /tasks/:id/toggle] error:', e);
    res.status(400).json({ error: 'Toggle error', details: e.message });
  }
});

export default router;