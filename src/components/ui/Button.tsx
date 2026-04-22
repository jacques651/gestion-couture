type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export default function Button({ children, variant = "primary" }: Props) {
  const base = "px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium";

  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return <button className={`${base} ${styles[variant]}`}>{children}</button>;
}