import { assetUrl, type User } from "@/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user?: User | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const name = user?.full_name ?? "";
  return (
    <Avatar size={size} className={className}>
      {user?.avatar_url && (
        <AvatarImage src={assetUrl(user.avatar_url)} alt="" />
      )}
      <AvatarFallback aria-hidden={!name} title={name || undefined}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
