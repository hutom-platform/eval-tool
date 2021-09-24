import { useState, useCallback, useEffect } from "react";
import FileLoader from "../../components/FileLoader";
import RecordsTable from "../../components/RecordsTable";
import { ScrollableSection } from "../../components/ScrollableSection/style";
import { db, subscribe } from "../../services/idb";

function App() {
  const [videoInput, setVideoInput] = useState();
  const [gtInput, setGtInput] = useState();
  const [onProcessing, setOnProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [records, setRecords] = useState([]);

  const onChange = useCallback(async (e) => {
    if (onProcessing) return;

    const file = e.target.files[0];

    if (!file) return;

    switch (e.target.id) {
      case "gt":
        setGtInput(file);
        break;

      case "video":
        setVideoInput(file);
        break;
    }
  }, [onProcessing]);

  const printMessage = useCallback((scope, status, action) => {
    setMessages((messages) => messages.concat(`[${scope}] ${status}: ${action}`));
  }, []);

  const openWorkDir = useCallback((e) => {
    window.api.openPath(e.target.dataset.workDir);
  }, []);

  useEffect(async () => {
    await subscribe("records", setRecords);
  }, []);

  useEffect(() => {
    if (gtInput && videoInput) {
      setOnProcessing(true);
    }
  }, [gtInput, videoInput]);

  useEffect(async () => {
    if (!gtInput || !videoInput || !onProcessing) return;

    printMessage(videoInput.name, "start", "extracting frames");

    const workDir = await window.api.getWorkDir();
    await window.api.extractFrames(workDir, videoInput.path);

    printMessage(videoInput.name, "done", "extracting frames");

    printMessage(videoInput.name, "start", "prediction");

    // TODO: 도커 컨테이너에 [workDir]/frames 전달 -> prediction 수행 -> 결과 .csv로 저장 (workDir에) => 결과 파일 저장 경로 반환
    // TODO: .csv 파일 경로 받고 -> eval -> 결과 .json으로 저장 (컨테이너가 직접 저장) => 결과 파일 저장 경로 반환
    const promises = ["mobile", "efficient"].map((withModel) => (
      window.api.predict(workDir, videoInput.name, withModel)
        .then((csvPath) => window.api.evalPrediction(csvPath, gtInput.path))
    ));

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.log(result);
      }
    });

    printMessage(videoInput.name, "done", "prediction");

    db.records.add({
      date: Date.now(),
      videoName: videoInput.name,
      workDir,
    });

    setGtInput();
    setVideoInput();
    setOnProcessing(false);
  }, [gtInput, videoInput, onProcessing]);

  return (
    <>
      <h1>Eval Tool</h1>
      <section>
        <FileLoader id="gt" label="JSON 형식의 gt 파일을 선택 해 주세요." accept="application/JSON" onChange={onChange} />
        <FileLoader id="video" label="비디오를 선택 해 주세요." accept="video/mp4" onChange={onChange} />
      </section>
      <ScrollableSection messages={messages} />
      <section>
        <RecordsTable records={records} openWorkDir={openWorkDir} />
      </section>
    </>
  );
}

export default App;
