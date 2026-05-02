import { Course, Faculty, Enrollment, Tlfq, Question, Response } from '../db.js';

export const getCourses = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const courses = await Course.find();
      return res.status(200).json(courses);
    } else {
      const enrollments = await Enrollment.find({ student_id: req.user.id });
      const courseIds = enrollments.map(e => e.course_id);

      const courses = await Course.find({ _id: { $in: courseIds } });

      const courseData = [];
      for (const course of courses) {
        const tlfq = await Tlfq.findOne({ course_id: course._id });
        let completed = 0;
        if (tlfq) {
          const resp = await Response.findOne({ student_id: req.user.id, tlfq_id: tlfq._id });
          if (resp) completed = 1;
        }

        courseData.push({
          ...course.toJSON(),
          completed
        });
      }

      return res.status(200).json(courseData);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCourseTlfq = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tlfq = await Tlfq.findOne({ course_id: courseId });
    if (!tlfq) {
      return res.status(404).json({ message: 'No evaluation questionnaire found for this course' });
    }

    const faculty = await Faculty.findById(tlfq.faculty_id);
    const course = await Course.findById(tlfq.course_id);
    const questions = await Question.find({ tlfq_id: tlfq._id });

    return res.status(200).json({
      ...tlfq.toJSON(),
      faculty_name: faculty ? faculty.name : 'Unknown',
      course_name: course ? course.name : 'Unknown',
      questions: questions.map(q => q.toJSON())
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCourseEvaluations = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tlfqs = await Tlfq.find({ course_id: courseId });
    const evaluations = [];

    for (const tlfq of tlfqs) {
      const faculty = await Faculty.findById(tlfq.faculty_id);
      const resp = await Response.findOne({ student_id: req.user.id, tlfq_id: tlfq._id });

      evaluations.push({
        ...tlfq.toJSON(),
        faculty_name: faculty ? faculty.name : 'Unknown',
        completed: !!resp
      });
    }

    return res.status(200).json(evaluations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getSpecificEvaluation = async (req, res) => {
  try {
    const { courseId, tlfqId } = req.params;
    const tlfq = await Tlfq.findById(tlfqId);
    if (!tlfq) {
      return res.status(404).json({ message: 'No evaluation questionnaire found.' });
    }

    const faculty = await Faculty.findById(tlfq.faculty_id);
    const course = await Course.findById(tlfq.course_id);
    const questions = await Question.find({ tlfq_id: tlfq._id });

    return res.status(200).json({
      ...tlfq.toJSON(),
      faculty_name: faculty ? faculty.name : 'Unknown',
      course_name: course ? course.name : 'Unknown',
      questions: questions.map(q => q.toJSON())
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find();
    return res.status(200).json(facultyList);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code required' });
    const result = await Course.create({ name, code });
    return res.status(201).json(result.toJSON());
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await Faculty.create({ name });
    return res.status(201).json(result.toJSON());
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createTlfq = async (req, res) => {
  try {
    const { course_id, faculty_id, title, question_texts } = req.body;
    if (!course_id || !faculty_id || !title) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    const result = await Tlfq.create({ course_id, faculty_id, title });
    
    if (question_texts && Array.isArray(question_texts)) {
      for (const qText of question_texts) {
        if (qText) {
          await Question.create({ tlfq_id: result._id, question_text: qText });
        }
      }
    }
    return res.status(201).json({ id: result.id, message: 'TLFQ created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { tlfq_id, question_text } = req.body;
    if (!tlfq_id || !question_text) return res.status(400).json({ message: 'tlfq_id and text required' });
    const result = await Question.create({ tlfq_id, question_text });
    return res.status(201).json(result.toJSON());
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    await Faculty.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

