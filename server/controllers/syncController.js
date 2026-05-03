import { User, Course, Faculty, Enrollment, Tlfq, Question, Response, Answer } from '../db.js';

export const exportData = async (req, res) => {
  try {
    const users = await User.find({});
    const courses = await Course.find({});
    const faculty = await Faculty.find({});
    const enrollments = await Enrollment.find({});
    const tlfqs = await Tlfq.find({});
    const questions = await Question.find({});
    const responses = await Response.find({});
    const answers = await Answer.find({});

    return res.status(200).json({
      User: users,
      Course: courses,
      Faculty: faculty,
      Enrollment: enrollments,
      Tlfq: tlfqs,
      Question: questions,
      Response: responses,
      Answer: answers
    });
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ message: 'Error exporting data', error: err.message });
  }
};

export const importData = async (req, res) => {
  try {
    const { data, mode } = req.body; // mode: 'merge' or 'overwrite'
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Invalid or missing sync data payload' });
    }

    const collections = ['User', 'Course', 'Faculty', 'Enrollment', 'Tlfq', 'Question', 'Response', 'Answer'];
    const models = { User, Course, Faculty, Enrollment, Tlfq, Question, Response, Answer };

    if (mode === 'overwrite') {
      // Wipes everything
      for (const col of collections) {
        await models[col].deleteMany({});
      }
    }

    // Insert everything
    for (const col of collections) {
      if (data[col] && Array.isArray(data[col])) {
        for (const item of data[col]) {
          const id = item._id || item.id;
          if (mode === 'merge' && id) {
            await models[col].findByIdAndDelete(id);
          }
          const cleanItem = { ...item };
          if (!cleanItem._id && cleanItem.id) {
            cleanItem._id = cleanItem.id;
          }
          delete cleanItem.id;
          
          await models[col].create(cleanItem);
        }
      }
    }

    return res.status(200).json({ message: `Full system data synchronized successfully using mode: ${mode}` });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ message: 'Error importing and synchronizing data', error: err.message });
  }
};
