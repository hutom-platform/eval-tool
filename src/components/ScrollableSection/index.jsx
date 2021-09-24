import PropTypes from "prop-types";
import { memo, useEffect, useRef } from "react";
import * as S from "./style";

function ScrollableSection({ messages }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <S.ScrollableSection>
      {messages.map((message, i) => <div key={i}>{message}</div>)}
      <div ref={endOfMessagesRef} />
    </S.ScrollableSection>
  );
}

function areEqual(prevProps, nextProps) {  
  return JSON.stringify(prevProps.messages) === JSON.stringify(nextProps.messages);
}

export default memo(ScrollableSection, areEqual);

ScrollableSection.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string).isRequired,
};
