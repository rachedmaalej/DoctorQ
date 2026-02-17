interface PSAbsentButtonProps {
  isAbsent: boolean;
  onToggle: () => void;
}

export default function PSAbsentButton({ isAbsent, onToggle }: PSAbsentButtonProps) {
  return (
    <button
      className={`ps-absent-btn ps-fade-up-d5 ${isAbsent ? 'is-absent' : ''}`}
      onClick={onToggle}
    >
      <span className="material-symbols-rounded">
        {isAbsent ? 'location_off' : 'directions_walk'}
      </span>
      {isAbsent ? 'Absent — On vous préviendra' : "Je m'absente un moment"}
    </button>
  );
}
