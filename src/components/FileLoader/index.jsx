import PropTypes from "prop-types";
import * as S from "./style";

function FileLoader({ id, label, accept, onChange }) {
  return (
    <div>
      <S.Label htmlFor={id}>{label}</S.Label>
      <input type="file" id={id} accept={accept} onChange={onChange} />
    </div>
  );
}

export default FileLoader;

FileLoader.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  accept: PropTypes.string,
  onChange: PropTypes.func,
};
