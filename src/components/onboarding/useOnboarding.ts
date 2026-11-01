import { useState } from 'react';
import type { EventSetup } from '../../types/plan';
import { useAbortableRequest } from '../../hooks/useAbortableRequest';
import { mergeParsedData } from './parseHelper';

export function useOnboarding(
  setup: EventSetup,
  onSetupChange: (s: EventSetup) => void
) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState('');
  const [aiDemo, setAiDemo] = useState<boolean | undefined>(undefined);

  const parseRequest = useAbortableRequest<
    { text: string },
    { data?: Record<string, unknown>; error?: string; demo?: boolean }
  >(async (payload, signal) => {
    const res = await fetch('/api/parse-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload.text }),
      signal,
    });
    return res.json();
  });

  function setField(field: keyof EventSetup, value: EventSetup[keyof EventSetup]) {
    onSetupChange({ ...setup, [field]: value });
  }

  function togglePriority(val: string) {
    const cur = setup.priorities;
    if (cur.includes(val)) {
      setField('priorities', cur.filter((p) => p !== val));
    } else if (cur.length < 3) {
      setField('priorities', [...cur, val]);
    }
  }

  function handleLoadSample() {
    setText(
      'We are planning a wedding in Mumbai for around 200 guests on 15 February 2027. Budget is 25 lakhs. Top priorities are food and photography.'
    );
    setParseError('');
  }

  async function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) {
      setParseError('Please enter an event description before auto-filling.');
      return;
    }

    setParseError('');
    const json = await parseRequest.execute({ text: trimmed });
    if (!json) return;

    if (json.error) {
      setParseError(json.error);
      return;
    }

    const data = (json.data || json) as Record<string, unknown>;
    setAiDemo(typeof json.demo === 'boolean' ? json.demo : undefined);
    onSetupChange(mergeParsedData(setup, data));
  }

  return {
    text,
    setText,
    parseError,
    aiDemo,
    parsing: parseRequest.loading,
    setField,
    togglePriority,
    handleLoadSample,
    handleParse,
  };
}
