import { useAvailableYears, useYearFilter } from '../../hooks/use-year-filter'

export function YearPicker() {
  const years = useAvailableYears()
  const { selectedYear, setYear } = useYearFilter()

  if (years.length <= 1) return null

  return (
    <div className="flex items-center gap-1.5 text-sm overflow-x-auto max-w-[60vw] md:max-w-none">
      <button
        onClick={() => setYear(null)}
        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
          selectedYear === null
            ? 'bg-costco-red text-white'
            : 'bg-surface-3 text-text-2 hover:bg-surface-3/80'
        }`}
      >
        All
      </button>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => setYear(year)}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            selectedYear === year
              ? 'bg-costco-red text-white'
              : 'bg-surface-3 text-text-2 hover:bg-surface-3/80'
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  )
}
