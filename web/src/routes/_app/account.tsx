import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { api, assetUrl, type User } from "@/api"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_app/account")({
  component: AccountPage,
})

function AccountPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState("")
  const [avatar, setAvatar] = useState<File>()
  const [avatarPreview, setAvatarPreview] = useState<string>()
  const mutation = useMutation({
    mutationFn: () => api.updateProfile(fullName, avatar),
    onSuccess: (nextUser) => {
      queryClient.setQueryData<User>(["auth", "currentUser"], nextUser)
      setAvatar(undefined)
      if (fileRef.current) fileRef.current.value = ""
    },
  })

  useEffect(() => {
    if (user) setFullName(user.full_name)
  }, [user])

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(undefined)
      return
    }
    const preview = URL.createObjectURL(avatar)
    setAvatarPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [avatar])

  if (!user) return null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <main className="min-h-[calc(100svh-3.75rem)] bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-background p-5">
        <section>
          <h1 className="text-xl font-semibold">Tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem và cập nhật thông tin cá nhân.
          </p>
        </section>
        <form className="space-y-5" onSubmit={submit}>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {(avatar || user.avatar_url) && (
                <AvatarImage
                  src={avatarPreview ?? assetUrl(user.avatar_url!)}
                  alt=""
                />
              )}
              <AvatarFallback>{fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setAvatar(event.target.files?.[0])}
                aria-label="Ảnh đại diện"
              />
              <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP hoặc GIF; tối đa 5 MB.</p>
            </div>
          </div>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            maxLength={160}
            aria-label="Họ và tên"
            placeholder="Họ và tên"
          />
          <Input value={user.email} disabled aria-label="Email" />
          {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          {mutation.isSuccess && <p className="text-sm text-green-600">Đã cập nhật thông tin.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </div>
    </main>
  )
}
