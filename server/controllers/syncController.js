import { User, Course, Faculty, Enrollment, Tlfq, Question, Response, Answer, Department, Section, AcademicSession } from '../db.js';

export const exportData = async (req, res) => {
  try {
    const data = {
      Department: await Department.findMany(),
      Section: await Section.findMany(),
      User: await User.findMany(),
      Course: await Course.findMany(),
      Faculty: await Faculty.findMany(),
      Enrollment: await Enrollment.findMany(),
      Tlfq: await Tlfq.findMany(),
      Question: await Question.findMany(),
      Response: await Response.findMany(),
      Answer: await Answer.findMany()
    };

    return res.status(200).json(data);
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

    const collections = ['Department', 'Section', 'User', 'Course', 'Faculty', 'Enrollment', 'Tlfq', 'Question', 'Response', 'Answer'];
    const models = { Department, Section, User, Course, Faculty, Enrollment, Tlfq, Question, Response, Answer };

    if (mode === 'overwrite') {
      // Wipes everything - reverse order to handle foreign key constraints if any
      for (const col of [...collections].reverse()) {
        await models[col].deleteMany({});
      }
    }

    // Insert everything
    for (const col of collections) {
      if (data[col] && Array.isArray(data[col])) {
        const itemsToInsert = data[col].map(item => {
          const id = item.id || item._id;
          const cleanItem = { ...item };
          if (id) cleanItem.id = id;
          delete cleanItem._id;
          return cleanItem;
        });

        if (itemsToInsert.length > 0) {
          // Use createMany for high performance bulk insertion
          await models[col].createMany({ 
            data: itemsToInsert,
            skipDuplicates: mode === 'merge' 
          });
        }
      }
    }

    return res.status(200).json({ message: `Full system data synchronized successfully using mode: ${mode}` });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ message: 'Error importing and synchronizing data', error: err.message });
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    let session = await AcademicSession.findFirst({ where: { is_active: true } });
    if (!session) {
      // fallback to most recent session
      const sessions = await AcademicSession.findMany({ orderBy: { start_year: 'desc' }, take: 1 });
      session = sessions[0] || null;
    }

    if (!session) return res.status(404).json({ message: 'No academic session found' });

    return res.json({ id: session.id, name: session.name, start_year: session.start_year, end_year: session.end_year, is_active: session.is_active });
  } catch (err) {
    console.error('Get current session error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
