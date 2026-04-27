const OpenAI = require('openai');
const Chat = require('../models/Chat');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful AI Student Support Assistant for a university. 
You help students with:
- Course information and registration
- Tuition fees and payment deadlines
- Class schedules and academic calendar
- Department contacts and office locations
- Campus services and resources
- General university guidance

Be friendly, concise, and helpful. If you don't know specific details, guide students to contact the relevant department.`;

const getFallbackResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('registration') || msg.includes('enroll'))
    return 'Registration for the upcoming semester opens on the 1st of each month. Visit the Registrar\'s Office or the student portal to enroll in courses. Deadline is typically 2 weeks before semester start.';
  if (msg.includes('tuition') || msg.includes('fee') || msg.includes('pay'))
    return 'Tuition fees are due at the start of each semester. You can pay online via the student portal, bank transfer, or in person at the Finance Office (Building A, Room 101). Contact finance@university.edu for payment plans.';
  if (msg.includes('schedule') || msg.includes('class') || msg.includes('timetable'))
    return 'Class schedules are available on the student portal under "My Courses". You can also visit the Academic Affairs office for a printed copy. Schedules are finalized 1 week before semester start.';
  if (msg.includes('registrar'))
    return 'The Registrar\'s Office is located in Building B, Room 201. Office hours: Mon-Fri 8AM-5PM. Email: registrar@university.edu | Phone: (555) 123-4567';
  if (msg.includes('course') || msg.includes('subject'))
    return 'Course catalog is available on the university website. We offer programs in Engineering, Business, Arts, Sciences, and more. Contact your academic advisor for course recommendations.';
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    return 'Hello! I\'m your AI Student Support Assistant. I can help you with course registration, fees, schedules, and campus services. What do you need help with today?';
  return 'I\'m here to help with university-related questions! You can ask me about course registration, tuition fees, class schedules, department contacts, or any campus services. What would you like to know?';
};

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({ userId, sessionId });
    if (!chat) {
      chat = await Chat.create({
        userId, sessionId: sessionId || uuidv4(),
        title: message.slice(0, 40),
        messages: []
      });
    }

    chat.messages.push({ role: 'user', content: message });

    let aiResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chat.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 500,
      });
      aiResponse = completion.choices[0].message.content;
    } catch {
      aiResponse = getFallbackResponse(message);
    }

    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({ response: aiResponse, sessionId: chat.sessionId, chatId: chat._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id }).sort({ updatedAt: -1 }).select('sessionId title updatedAt messages');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
