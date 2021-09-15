import PropTypes from "prop-types";

function FileLoader({ id, label, accept, onChange }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
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
