import { forwardRef, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isGenerating: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, Props>(({
  value, onChange, onSend, onKeyDown, isGenerating,
}, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  }, [value]);

  return (
    <div>
      <div className="input-inner">
        <textarea
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask anything..."
          className="input-field"
          disabled={isGenerating}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isGenerating}
          className="btn-send"
        >
          <Send size={15} />
        </button>
      </div>
      <div className="input-disclaimer">
        Nexa AI may produce inaccurate information. Verify important facts.
      </div>
    </div>
  );
});
