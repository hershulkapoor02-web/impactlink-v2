const User = require('../models/User');

/**
 * Score a volunteer against a task.
 * Returns 0–100.
 */
function scoreVolunteer(volunteer, task) {
  let score = 0;

  // Skill overlap — up to 60 pts
  const required = task.skillsRequired || [];
  const userSkills = volunteer.skills || [];
  if (required.length > 0) {
    const matches = required.filter(s => userSkills.includes(s)).length;
    score += (matches / required.length) * 60;
  } else {
    score += 30; // no skill requirement — base points
  }

  // Availability bonus — up to 20 pts
  const avBonus = { full_time: 20, part_time: 15, weekends: 10, on_demand: 5 };
  score += avBonus[volunteer.availability] || 5;

  // Location match — up to 15 pts
  if (volunteer.location?.city && task.location?.city) {
    if (volunteer.location.city.toLowerCase() === task.location.city.toLowerCase()) score += 15;
    else if (volunteer.location.state === task.location.state) score += 7;
  }

  // Activity bonus — up to 5 pts (recent active users)
  if (volunteer.lastActive) {
    const daysSince = (Date.now() - new Date(volunteer.lastActive)) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 5;
    else if (daysSince < 30) score += 2;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Find top N volunteers for a task.
 */
async function getTopMatches(task, limit = 10) {
  const volunteers = await User.find({
    role: 'volunteer',
    isActive: true,
    // Soft filter: if skills required, prefer users with at least one
    ...(task.skillsRequired?.length > 0 ? {
      $or: [
        { skills: { $in: task.skillsRequired } },
        { skills: { $exists: true, $size: 0 } } // include anyone with no skills yet
      ]
    } : {})
  }).select('name avatar skills availability location lastActive tasksCompleted');

  const scored = volunteers.map(v => ({
    volunteer: v,
    score: scoreVolunteer(v, task)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Get best-matched tasks for a volunteer (for their dashboard).
 */
async function getMatchedTasks(volunteer, tasks) {
  return tasks
    .map(t => ({ task: t, score: scoreVolunteer(volunteer, t) }))
    .sort((a, b) => (b.task.urgencyScore - a.task.urgencyScore) + (b.score - a.score) * 0.5)
    .map(item => ({ ...item.task.toObject(), matchScore: item.score }));
}

module.exports = { scoreVolunteer, getTopMatches, getMatchedTasks };
