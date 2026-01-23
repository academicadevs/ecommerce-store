import { useState } from 'react';

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', type: 'thisMonth' },
  { label: 'Last month', type: 'lastMonth' },
  { label: 'This year', type: 'thisYear' },
];

function getPresetDates(preset) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  let start = new Date();

  if (preset.days) {
    start.setDate(start.getDate() - preset.days);
  } else if (preset.type === 'thisMonth') {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else if (preset.type === 'lastMonth') {
    start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    end.setDate(0); // Last day of previous month
  } else if (preset.type === 'thisYear') {
    start = new Date(end.getFullYear(), 0, 1);
  }

  start.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [showPresets, setShowPresets] = useState(false);

  const handleStartChange = (e) => {
    const newStart = new Date(e.target.value);
    newStart.setHours(0, 0, 0, 0);
    onChange({ startDate: newStart, endDate });
  };

  const handleEndChange = (e) => {
    const newEnd = new Date(e.target.value);
    newEnd.setHours(23, 59, 59, 999);
    onChange({ startDate, endDate: newEnd });
  };

  const handlePresetClick = (preset) => {
    const { startDate: newStart, endDate: newEnd } = getPresetDates(preset);
    onChange({ startDate: newStart, endDate: newEnd });
    setShowPresets(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Quick Select
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPresets && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            {presetRanges.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartChange}
          max={formatDateForInput(endDate)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndChange}
          min={formatDateForInput(startDate)}
          max={formatDateForInput(new Date())}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
