
interface BadgeProps {
    label: string;
}

const Badge = ({ label }: BadgeProps) => (
    <span className="inline-block text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-700">
        {label}
    </span>
);

export default Badge;
