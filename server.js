// server.js: Node.js 서버 파일
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Body Parser 설정
app.use(bodyParser.json());

// MongoDB 연결
mongoose.connect('mongodb+srv://alswn235:0302@cluster1.aerc0.mongodb.net/eventDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB 연결 성공"))
  .catch(err => console.error("MongoDB 연결 실패:", err));

// 이벤트 스키마 및 모델 생성
const eventSchema = new mongoose.Schema({
  name: String,
  date: String,
  startTime: String,
  endTime: String
});

const Event = mongoose.model('Event', eventSchema);

const cors = require('cors');
app.use(cors({
  origin: '*', // 모든 도메인 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 사용할 HTTP 메서드 설정
  allowedHeaders: ['Content-Type']
}));
// 이벤트 생성 라우트
app.post('/api/events', async (req, res) => {
  const { name, date, startTime, endTime } = req.body;

  // 요청 데이터 로그 추가
  console.log("이벤트 생성 요청 데이터:", { name, date, startTime, endTime });

  try {
    const newEvent = new Event({ name, date, startTime, endTime });
    await newEvent.save();

    // 저장된 이벤트 로그 추가
    console.log("이벤트가 성공적으로 저장되었습니다:", newEvent);

    // JSON 형태로 응답을 반환
    res.status(201).json({ message: '이벤트가 성공적으로 저장되었습니다.', eventId: newEvent._id });
  } catch (error) {
    console.error("이벤트 저장 중 오류 발생:", error);
    res.status(500).json({ message: '이벤트 저장 중 오류가 발생했습니다.' });
  }
});

// 특정 이벤트 시간 선택 페이지로 이동
app.get('/events/:id/select', async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (event) {
      res.status(200).sendFile(path.join(__dirname, 'select.html'));
    } else {
      res.status(404).send('이벤트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error("시간 선택 페이지로 이동 중 오류 발생:", error);
    res.status(500).send('이벤트 조회 중 오류가 발생했습니다.');
  }
});

// 이벤트 조회 라우트
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({}); // 모든 이벤트 조회
    res.status(200).json(events);        // JSON 형식으로 응답
  } catch (error) {
    console.error("이벤트 조회 중 오류 발생:", error);
    res.status(500).send('이벤트 조회 중 오류가 발생했습니다.');
  }
});

// 서버 실행
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
