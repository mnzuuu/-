// 필수 모듈 불러오기
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors({
  origin: '*', // 모든 도메인 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// MongoDB 연결 설정
mongoose.connect('mongodb+srv://alswn235:0302@cluster1.aerc0.mongodb.net/eventDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB 연결 성공"))
  .catch(err => console.error("MongoDB 연결 실패:", err));

// ====== 스키마 및 모델 정의 ======

// 이벤트 스키마 및 모델
const eventSchema = new mongoose.Schema({
  name: String,
  dates: [String],
  startTime: String,
  endTime: String,
});
const Event = mongoose.model('Event', eventSchema);

// 선택된 시간대 스키마 및 모델
const selectedTimeSchema = new mongoose.Schema({
  eventId: String,
  selectedSlots: {
    type: Map,
    of: [String], // 날짜별 시간 배열
    required: true,
  },
});
const SelectedTime = mongoose.model('selected_times', selectedTimeSchema);

// ====== 라우트 정의 ======

// 이벤트 생성
app.post('/api/events', async (req, res) => {
  const { name, dates, startTime, endTime } = req.body;

  try {
    const newEvent = new Event({ name, dates, startTime, endTime });
    await newEvent.save();
    console.log("이벤트가 성공적으로 저장되었습니다:", newEvent);
    res.status(201).json({ message: '이벤트가 성공적으로 저장되었습니다.', eventId: newEvent._id });
  } catch (error) {
    console.error("이벤트 저장 중 오류 발생:", error);
    res.status(500).json({ message: '이벤트 저장 중 오류가 발생했습니다.' });
  }
});

// 시간대 저장 라우트
app.post('/api/save-selected-slots', async (req, res) => {
  const { eventId, selectedSlots } = req.body;
  
  try {
    let selectedTime = await SelectedTime.findOne({ eventId });
    
    if (selectedTime) {
        // 기존 데이터가 있을 경우 업데이트
        selectedTime.selectedSlots = selectedSlots;
    } else {
        // 새로운 데이터 생성
        selectedTime = new SelectedTime({ eventId, selectedSlots });
    }

    await selectedTime.save();
    res.status(200).json({ message: '선택된 시간대가 성공적으로 저장되었습니다.' });
} catch (error) {
    console.error('시간대 저장 중 오류 발생:', error);
    res.status(500).json({ message: '시간대 저장 중 오류가 발생했습니다.' });
}
});



// ====== 정적 파일 및 HTML 제공 ======

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

// 특정 이벤트 시간 선택 페이지 제공
app.get('/events/select', (req, res) => {
  res.sendFile(path.join(__dirname, 'select.html'));
});

// 특정 이벤트 시간 선택 페이지로 이동
app.get('/events/:id/select', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('잘못된 이벤트 ID입니다.');
  }
  try {
    const event = await Event.findById(id);
    if (event) {
      console.log("이벤트 조회 성공:", event);
      res.status(200).sendFile(__dirname + '/select.html');
    } else {
      console.error("이벤트를 찾을 수 없습니다:", id);
      res.status(404).send('이벤트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error("시간 선택 페이지로 이동 중 오류 발생:", error);
    res.status(500).send('이벤트 조회 중 오류가 발생했습니다.');
  }
});

// 특정 이벤트 조회 라우트 (JSON 데이터 응답)
app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: '잘못된 이벤트 ID입니다.' });
  }
  try {
    const event = await Event.findById(id);
    if (event) {
      console.log("이벤트 조회 성공:", event);
      res.status(200).json(event);
    } else {
      console.error("이벤트를 찾을 수 없습니다:", id);
      res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error("이벤트 조회 중 오류 발생:", error);
    res.status(500).json({ message: '이벤트 조회 중 오류가 발생했습니다.' });
  }
});

// ====== 서버 실행 ======
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
