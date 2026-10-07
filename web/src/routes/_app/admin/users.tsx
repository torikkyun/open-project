import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react"

import { api, type User, type UserCreate, type UserUpdate } from "@/api"
import { useAuth } from "@/components/auth-provider"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/_app/admin/users")({
  component: AccountManagementPage,
})

const usersQueryKey = ["users"]

type AccountDialog =
  | { type: "create" }
  | { type: "edit"; account: User }
  | null

function AccountManagementPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [accountDialog, setAccountDialog] = useState<AccountDialog>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: api.listUsers,
    enabled: user?.role === "admin",
  })
  const createUserMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: (invite) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (accounts) =>
        [...(accounts ?? []), invite.user].sort((a, b) =>
          a.email.localeCompare(b.email),
        ),
      )
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
  const updateUserMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UserUpdate }) =>
      api.updateUser(id, changes),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (accounts) =>
        accounts
          ?.map((account) =>
            account.id === updatedUser.id ? updatedUser : account,
          )
          .sort((a, b) => a.email.localeCompare(b.email)),
      )
      if (updatedUser.id === user?.id) login(updatedUser)
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
  const deleteUserMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (accounts) =>
        accounts?.filter((account) => account.id !== deletedId),
      )
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      void navigate({ to: "/", replace: true })
    }
  }, [navigate, user])

  const accounts = usersQuery.data ?? []
  const normalizedSearch = useDeferredValue(search).trim().toLocaleLowerCase()
  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          (!normalizedSearch ||
            account.full_name.toLocaleLowerCase().includes(normalizedSearch) ||
            account.email.toLocaleLowerCase().includes(normalizedSearch)) &&
          (roleFilter === "all" || account.role === roleFilter) &&
          (statusFilter === "all" ||
            (statusFilter === "active" ? account.is_active : !account.is_active)),
      ),
    [accounts, normalizedSearch, roleFilter, statusFilter],
  )

  if (user?.role !== "admin") return null

  const activeAdminCount = accounts.filter(
    (account) => account.role === "admin" && account.is_active,
  ).length
  const canRemoveAdmin = (account: User) =>
    account.role !== "admin" ||
    !account.is_active ||
    activeAdminCount > 1
  const mutationError = updateUserMutation.error ?? createUserMutation.error

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountDialog) return
    const form = new FormData(event.currentTarget)
    if (accountDialog.type === "create") {
      const account: UserCreate = {
        email: String(form.get("email")),
        full_name: String(form.get("full_name")),
      }
      createUserMutation.mutate(account)
      return
    }

    const changes: UserUpdate = {
      full_name: String(form.get("full_name")),
      role: String(form.get("role")) as User["role"],
    }
    updateUserMutation.mutate(
      { id: accountDialog.account.id, changes },
      { onSuccess: () => setAccountDialog(null) },
    )
  }

  function toggleActive(account: User) {
    updateUserMutation.mutate({
      id: account.id,
      changes: { is_active: !account.is_active },
    })
  }

  const savingAccount =
    createUserMutation.isPending || updateUserMutation.isPending
  const invite = createUserMutation.data

  return (
    <main className="flex h-[calc(100svh-3.75rem)] min-h-0 flex-col gap-2 overflow-hidden bg-muted/30 sm:p-2 sm:pb-0 md:h-[calc(100svh-4.25rem)]">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem, tạo và quản lý quyền truy cập của thành viên.
          </p>
        </div>
        <Button
          onClick={() => {
            createUserMutation.reset()
            updateUserMutation.reset()
            setCopied(false)
            setAccountDialog({ type: "create" })
          }}
        >
          <Plus data-icon="inline-start" />
          Tạo tài khoản
        </Button>
      </header>

      <section className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2 overflow-hidden rounded-lg border bg-background p-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc email"
            aria-label="Tìm theo tên hoặc email"
            className="min-w-52 flex-1 sm:max-w-xs"
          />
          <NativeSelect
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Lọc theo vai trò"
            className="min-w-36"
          >
            <NativeSelectOption value="all">Mọi vai trò</NativeSelectOption>
            <NativeSelectOption value="admin">Quản trị viên</NativeSelectOption>
            <NativeSelectOption value="employee">Nhân viên</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Lọc theo trạng thái"
            className="min-w-36"
          >
            <NativeSelectOption value="all">Mọi trạng thái</NativeSelectOption>
            <NativeSelectOption value="active">Đang hoạt động</NativeSelectOption>
            <NativeSelectOption value="inactive">Đã khóa</NativeSelectOption>
          </NativeSelect>
        </div>

        {mutationError && !accountDialog && !deleteTarget && (
          <p role="alert" className="text-sm text-destructive">
            {mutationError.message}
          </p>
        )}
        {usersQuery.error && (
          <p role="alert" className="text-sm text-destructive">
            {usersQuery.error.message}
          </p>
        )}

        <Table
          containerClassName="min-h-0 min-w-0 max-w-full flex-1 overflow-auto"
          className="min-w-[720px]"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-background">
                Tài khoản
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-background">
                Vai trò
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-background">
                Trạng thái
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-background text-right">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isPending ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-16 text-center text-muted-foreground"
                >
                  Đang tải tài khoản...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-16 text-center text-muted-foreground"
                >
                  {accounts.length
                    ? "Không tìm thấy tài khoản phù hợp."
                    : "Chưa có tài khoản nào."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex min-w-48 items-center gap-2">
                      <UserAvatar user={account} />
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">
                          {account.full_name}
                        </span>
                        <span className="text-muted-foreground">
                          {account.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {account.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                  </TableCell>
                  <TableCell>
                    {account.is_active ? "Đang hoạt động" : "Đã khóa"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Sửa ${account.full_name}`}
                        title="Sửa tài khoản"
                        disabled={savingAccount}
                        onClick={() => {
                          createUserMutation.reset()
                          updateUserMutation.reset()
                          setAccountDialog({ type: "edit", account })
                        }}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={
                          account.is_active
                            ? `Khóa ${account.full_name}`
                            : `Mở khóa ${account.full_name}`
                        }
                        title={
                          account.is_active
                            ? "Khóa tài khoản"
                            : "Mở khóa tài khoản"
                        }
                        disabled={
                          updateUserMutation.isPending ||
                          account.id === user.id ||
                          !canRemoveAdmin(account)
                        }
                        onClick={() => toggleActive(account)}
                      >
                        {account.is_active ? (
                          <UserRoundX aria-hidden="true" />
                        ) : (
                          <UserRoundCheck aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Xóa ${account.full_name}`}
                        title="Xóa tài khoản"
                        disabled={
                          deleteUserMutation.isPending ||
                          account.id === user.id ||
                          !canRemoveAdmin(account)
                        }
                        onClick={() => {
                          deleteUserMutation.reset()
                          setDeleteTarget(account)
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
          <span>
            {filteredAccounts.length} / {accounts.length} tài khoản ·{" "}
            {activeAdminCount} quản trị viên đang hoạt động
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Tải lại tài khoản"
            onClick={() => void usersQuery.refetch()}
          >
            <RotateCw />
          </Button>
        </div>
      </section>

      <Dialog
        open={accountDialog !== null}
        onOpenChange={(open) => {
          if (!open && !savingAccount) setAccountDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accountDialog?.type === "create"
                ? "Tạo tài khoản"
                : "Sửa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              {invite
                ? "Sao chép liên kết đặt lại mật khẩu để gửi cho thành viên."
                : accountDialog?.type === "create"
                  ? "Nhập email và họ tên; hệ thống tự sinh mật khẩu và gửi liên kết đặt lại."
                  : "Cập nhật thông tin và vai trò tài khoản."}
            </DialogDescription>
          </DialogHeader>
          {invite ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm">
                Đã tạo tài khoản{" "}
                <span className="font-medium">{invite.user.full_name}</span>.
                Hệ thống đã sinh mật khẩu và gửi liên kết đặt lại mật khẩu tới{" "}
                {invite.user.email}.
              </p>
              <Field>
                <FieldLabel htmlFor="account-reset-link">
                  Liên kết đặt lại mật khẩu
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="account-reset-link"
                    readOnly
                    value={invite.reset_url}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(invite.reset_url)
                        setCopied(true)
                      }}
                    >
                      {copied ? "Đã sao chép" : "Sao chép"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  Liên kết chỉ dùng được một lần. Gửi cho thành viên nếu email
                  không tới.
                </FieldDescription>
              </Field>
              <DialogFooter>
                <Button type="button" onClick={() => setAccountDialog(null)}>
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          ) : accountDialog ? (
            <form onSubmit={submitAccount} className="flex flex-col gap-4">
              {(createUserMutation.error ?? updateUserMutation.error) && (
                <p role="alert" className="text-sm text-destructive">
                  {(createUserMutation.error ?? updateUserMutation.error)
                    ?.message}
                </p>
              )}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="account-name">Họ và tên</FieldLabel>
                  <Input
                    id="account-name"
                    name="full_name"
                    defaultValue={
                      accountDialog.type === "edit"
                        ? accountDialog.account.full_name
                        : ""
                    }
                    required
                    maxLength={160}
                  />
                </Field>
                {accountDialog.type === "create" ? (
                  <Field>
                    <FieldLabel htmlFor="account-email">Email</FieldLabel>
                    <Input
                      id="account-email"
                      name="email"
                      type="email"
                      required
                      maxLength={320}
                    />
                    <FieldDescription>
                      Mật khẩu do hệ thống sinh và gửi qua email đặt lại.
                    </FieldDescription>
                  </Field>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="account-email">Email</FieldLabel>
                      <Input
                        id="account-email"
                        readOnly
                        value={accountDialog.account.email}
                      />
                      <FieldDescription>
                        Tạm thời chưa đổi được email.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="account-role">Vai trò</FieldLabel>
                      <NativeSelect
                        id="account-role"
                        name="role"
                        defaultValue={accountDialog.account.role}
                      >
                        <NativeSelectOption value="admin">
                          Quản trị viên
                        </NativeSelectOption>
                        <NativeSelectOption
                          value="employee"
                          disabled={
                            !canRemoveAdmin(accountDialog.account) &&
                            accountDialog.account.role === "admin"
                          }
                        >
                          Nhân viên
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                  </>
                )}
              </FieldGroup>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingAccount}
                  onClick={() => setAccountDialog(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={savingAccount}>
                  {savingAccount ? "Đang lưu..." : "Lưu"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteUserMutation.isPending) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài khoản?</DialogTitle>
            <DialogDescription>
              Xóa {deleteTarget?.full_name} không thể hoàn tác. Tài khoản có dữ
              liệu dự án hoặc công việc không thể bị xóa.
            </DialogDescription>
          </DialogHeader>
          {deleteUserMutation.error && (
            <p role="alert" className="text-sm text-destructive">
              {deleteUserMutation.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleteUserMutation.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteTarget || deleteUserMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return
                deleteUserMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }}
            >
              {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
