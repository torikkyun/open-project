import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ImagePlus, Settings2, UserRound } from "lucide-react";

import { api, assetUrl, type User } from "@/api";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const maxAvatarSize = 5 * 1024 * 1024;

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [fileError, setFileError] = useState<string>();
  const mutation = useMutation({
    mutationFn: () => api.updateProfile(fullName.trim(), avatar),
    onSuccess: (nextUser) => {
      queryClient.setQueryData<User>(["auth", "currentUser"], nextUser);
      setAvatar(undefined);
      setFileError(undefined);
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(undefined);
      return;
    }
    const preview = URL.createObjectURL(avatar);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatar]);

  if (!user) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  function selectAvatar(file: File | undefined) {
    if (!file) return;
    if (!allowedAvatarTypes.includes(file.type)) {
      setAvatar(undefined);
      setFileError("Vui lòng chọn ảnh JPEG, PNG, WebP hoặc GIF.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > maxAvatarSize) {
      setAvatar(undefined);
      setFileError("Ảnh đại diện phải có dung lượng tối đa 5 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFileError(undefined);
    setAvatar(file);
  }

  const avatarSrc =
    avatarPreview ?? (user.avatar_url ? assetUrl(user.avatar_url) : undefined);

  return (
    <main className="min-h-[calc(100svh-3.75rem)] bg-muted/20 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Không gian làm việc
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và các tùy chọn cho không gian làm việc.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Danh mục cài đặt" className="flex flex-col gap-1">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tài khoản
            </p>
            <Button
              type="button"
              variant="secondary"
              className="justify-start"
              aria-current="page"
            >
              <UserRound data-icon="inline-start" />
              Thông tin cá nhân
            </Button>
            <p className="mt-5 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Không gian làm việc
            </p>
            <Button
              type="button"
              variant="ghost"
              className="justify-start"
              disabled
            >
              <Settings2 data-icon="inline-start" />
              Cài đặt ứng dụng
            </Button>
          </nav>

          <Card>
            <form onSubmit={submit}>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật tên hiển thị và ảnh đại diện của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="avatar-file">Ảnh đại diện</FieldLabel>
                    <div className="flex flex-wrap items-center gap-4">
                      <Avatar size="lg">
                        {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
                        <AvatarFallback>
                          {fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col items-start gap-2">
                        <input
                          ref={fileRef}
                          id="avatar-file"
                          type="file"
                          accept={allowedAvatarTypes.join(",")}
                          className="sr-only"
                          aria-label="Chọn ảnh đại diện"
                          onChange={(event) =>
                            selectAvatar(event.target.files?.[0])
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileRef.current?.click()}
                        >
                          <ImagePlus data-icon="inline-start" />
                          Chọn ảnh
                        </Button>
                        <FieldDescription className="max-w-sm">
                          JPEG, PNG, WebP hoặc GIF. Dung lượng tối đa 5 MB.
                          {avatar && (
                            <span className="mt-1 block truncate">
                              Đã chọn: {avatar.name}
                            </span>
                          )}
                        </FieldDescription>
                      </div>
                    </div>
                    {fileError && (
                      <p role="alert" className="text-sm text-destructive">
                        {fileError}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="full-name">Họ và tên</FieldLabel>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      maxLength={160}
                      autoComplete="name"
                      placeholder="Nhập họ và tên"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="account-email">Email</FieldLabel>
                    <Input
                      id="account-email"
                      type="email"
                      value={user.email}
                      readOnly
                      aria-readonly="true"
                    />
                    <FieldDescription>
                      Email được dùng để đăng nhập và không thể chỉnh sửa tại
                      đây.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite" className="text-sm">
                  {mutation.error && (
                    <p role="alert" className="text-destructive">
                      {mutation.error.message}
                    </p>
                  )}
                  {mutation.isSuccess && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Check data-icon="inline-start" />
                      Đã lưu thông tin cá nhân.
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={
                    mutation.isPending || !!fileError || !fullName.trim()
                  }
                >
                  {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
