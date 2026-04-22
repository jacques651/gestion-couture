type Props = {
  children: React.ReactNode;
};

export default function Card({ children }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-6">
      {children}
    </div>
  );
}