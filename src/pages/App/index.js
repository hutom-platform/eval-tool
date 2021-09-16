import { useState, useCallback, useRef, useEffect } from "react";
import FileLoader from "../../components/FileLoader";
import * as S from "./style";

function App() {
  const [videoInput, setVideoInput] = useState();
  const [gtInput, setGtInput] = useState();
  const [onProcessing, setOnProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  const endOfMessagesRef = useRef(null);

  const onChange = useCallback(async (e) => {
    if (onProcessing) return;

    const file = e.target.files[0];

    if (!file) return;

    if (e.target.id === "gt") {
      setGtInput(file);
      
      return;
    }

    if (e.target.id === "video") {
      setVideoInput(file);
    }
  }, [onProcessing]);

  const evalPrediction = async (csvPath) => {
    const result = await window.api.evalPrediction(csvPath, gtInput.path);

    console.log(result);
  };

  useEffect(() => {

  }, [gtInput]);

  useEffect(async () => {
    if (!videoInput) return;

    setOnProcessing(true);
    setMessages((messages) => messages.concat(`[${videoInput.name}] start: extracting frames`));

    const workDir = await window.api.getWorkDir();
    await window.api.extractFrames(workDir, videoInput.path);

    setMessages((messages) => messages.concat(`[${videoInput.name}] done: extracting frames`));

    setMessages((messages) => messages.concat(`[${videoInput.name}] start: prediction`));

    // TODO: 도커 컨테이너에 [workDir]/frames 전달 -> prediction 수행 -> 결과 .csv로 저장 (workDir에) => 결과 파일 저장 경로 반환
    const csvPath = await window.api.predict(workDir, "mobile");
    console.log(csvPath);

    setMessages((messages) => messages.concat(`[${videoInput.name}] done: prediction`));

    // TODO: prediction 결과 바탕으로 비디오 편집

    // TODO: .csv 파일 경로 받고 -> eval -> 결과 .json으로 저장 (컨테이너가 직접 저장) => 결과 파일 저장 경로 반환
    // await evalPrediction(csvPath);

    // TODO: IDB 업데이트 (날짜, 비디오 이름, gt 이름, workDir) -> 업데이트 구독 -> 테이블 렌더

    setOnProcessing(false);
  }, [videoInput]);

  useEffect(() => {
    endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      <h1>Eval Tool</h1>
      <section>
        <FileLoader id="gt" label="gt.json" accept="application/JSON" onChange={onChange} />
        <FileLoader id="video" label="video.mp4" accept="video/mp4" onChange={onChange} />
      </section>
      <S.ScrollableSection>
        {messages.map((message, i) => <div key={i}>{message}</div>)}
        <div ref={endOfMessagesRef} />
      </S.ScrollableSection>
      <section>
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>비디오</th>
              <th>gt</th>
              <th>디렉토리</th>
            </tr>
          </thead>
        </table>
      </section>
    </div>
  );
}

export default App;
