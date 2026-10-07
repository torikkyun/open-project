import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, type FormEvent } from "react"
import { Pencil, Plus, Trash2, UserRoundCheck, UserRoundX } from "lucide-react"

import { api, type User, type UserCreate, type UserUpdate } from "@/api"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
    onSuccess: (createdUser) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (accounts) =>
        [...(accounts ?? []), createdUser].sort((a, b) =>
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

  if (user?.role !== "admin") return null

  const accounts = usersQuery.data ?? []
  const filteredAccounts = accounts.filter((account) => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return (
      (!normalizedSearch ||
        account.full_name.toLocaleLowerCase().includes(normalizedSearch) ||
        account.email.toLocaleLowerCase().includes(normalizedSearch)) &&
      (roleFilter === "all" || account.role === roleFilter) &&
      (statusFilter === "all" ||
        (statusFilter === "active" ? account.is_active : !account.is_active))
    )
  })
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
        password: String(form.get("password")),
      }
      createUserMutation.mutate(account, {
        onSuccess: () => setAccountDialog(null),
      })
      return
    }

    const changes: UserUpdate = {
      email: String(form.get("email")),
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

  return (
    <main className="min-h-[calc(100svh-3.75rem)] bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Quản lý tài khoản
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem, tạo và quản lý quyền truy cập của thành viên.
            </p>
          </div>
          <Button
            onClick={() => {
              createUserMutation.reset()
              updateUserMutation.reset()
              setAccountDialog({ type: "create" })
            }}
          >
            <Plus data-icon="inline-start" />
            Tạo tài khoản
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Thành viên</CardTitle>
            <CardDescription>
              {accounts.length} tài khoản ·{" "}
              {accounts.filter((account) => account.is_active).length} đang hoạt
              động
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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

            {usersQuery.isPending ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Đang tải tài khoản...
              </p>
            ) : filteredAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {accounts.length
                  ? "Không tìm thấy tài khoản phù hợp."
                  : "Chưa có tài khoản nào."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex min-w-48 flex-col gap-1">
                          <span className="font-medium">
                            {account.full_name}
                          </span>
                          <span className="text-muted-foreground">
                            {account.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.role === "admin"
                          ? "Quản trị viên"
                          : "Nhân viên"}
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

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
              {accountDialog?.type === "create"
                ? "Tạo tài khoản mới cho thành viên."
                : "Cập nhật thông tin và vai trò tài khoản."}
            </DialogDescription>
          </DialogHeader>
          {accountDialog && (
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
                <Field>
                  <FieldLabel htmlFor="account-email">Email</FieldLabel>
                  <Input
                    id="account-email"
                    name="email"
                    type="email"
                    defaultValue={
                      accountDialog.type === "edit"
                        ? accountDialog.account.email
                        : ""
                    }
                    required
                    maxLength={320}
                  />
                </Field>
                {accountDialog.type === "create" ? (
                  <Field>
                    <FieldLabel htmlFor="account-password">Mật khẩu</FieldLabel>
                    <Input
                      id="account-password"
                      name="password"
                      type="password"
                      minLength={12}
                      maxLength={128}
                      required
                    />
                  </Field>
                ) : (
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
          )}
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
