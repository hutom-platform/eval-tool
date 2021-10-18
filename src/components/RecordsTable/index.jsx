import PropTypes from "prop-types";
import { memo } from "react";
import * as S from "./style";

function RecordsTable({ records, openWorkDir }) {
  return (
    <table>
      <thead>
        <tr>
          <th>날짜</th>
          <th>비디오</th>
          <th>디렉토리</th>
        </tr>
      </thead>
      <tbody>
        {
          records.map((record) => (
            <tr key={record.date}>
              <td>{(new Date(record.date)).toString()}</td>
              <td>{record.videoName}</td>
              <S.ClickableTd onClick={openWorkDir} data-work-dir={record.workDir}>{record.workDir}</S.ClickableTd>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}

function areEqual(prevProps, nextProps) {  
  return JSON.stringify(prevProps.records) === JSON.stringify(nextProps.records);
}

export default memo(RecordsTable, areEqual);

RecordsTable.propTypes = {
  records: PropTypes.arrayOf(PropTypes.shape({
    data: PropTypes.string,
    videoName: PropTypes.string,
    workDir: PropTypes.string,
  })).isRequired,
  openWorkDir: PropTypes.func.isRequired,
};
