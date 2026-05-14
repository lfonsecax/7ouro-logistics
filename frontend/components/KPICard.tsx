import clsx from "clsx";

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: "green" | "red" | "yellow" | "blue" | "orange" | "default";
}

const colors = {
  green: "border-green-500 text-green-400",
  red: "border-red-500 text-red-400",
  yellow: "border-brand-500 text-brand-400",
  blue: "border-blue-500 text-blue-400",
  orange: "border-orange-500 text-orange-400",
  default: "border-gray-700 text-gray-100",
};

export default function KPICard({ label, value, sub, color = "default" }: Props) {
  return (
    <div className={clsx("bg-gray-900 rounded-xl border-l-4 p-5", colors[color])}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={clsx("text-2xl font-bold mt-1", colors[color].split(" ")[1])}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
