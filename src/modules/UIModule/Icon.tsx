import icons from "./icons.json";
export default function Icon({
  name = "lucide:wine",
  size = 20,
  className = "",
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const normalized = name.replace(/^i-([a-z]+)-/, "$1:");
  const icon =
    (icons as Record<string, any>)[normalized] ||
    (icons as Record<string, any>)["lucide:wine"];
  return icon ? (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      className={"shrink-0 " + className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  ) : null;
}
