'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { Plus, Edit } from 'lucide-react'
import type { Employee, ExpenseCategory, CompanySettings } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    brand_name: '',
    office_address: '',
    phone: '',
    email: '',
  })

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    designation: '',
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, employeesRes, categoriesRes] = await Promise.all([
        supabase.from('company_settings').select('*').single(),
        supabase.from('employees').select('*').order('name'),
        supabase.from('expense_categories').select('*').order('name'),
      ])

      if (settingsRes.data) {
        setSettings(settingsRes.data)
        setCompanyForm({
          company_name: settingsRes.data.company_name,
          brand_name: settingsRes.data.brand_name,
          office_address: settingsRes.data.office_address || '',
          phone: settingsRes.data.phone || '',
          email: settingsRes.data.email || '',
        })
      }
      if (employeesRes.data) setEmployees(employeesRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    fetchData()
  }, [])

  const saveCompanySettings = async () => {
    if (!settings) {
      toast.error('Settings not loaded')
      return
    }
    
    try {
      const { error } = await supabase
        .from('company_settings')
        .update(companyForm)
        .eq('id', settings.id)

      if (error) throw error

      toast.success('Company settings updated')
      fetchData()
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const saveEmployee = async () => {
    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeForm)
          .eq('id', editingEmployee.id)
        if (error) throw error
        toast.success('Employee updated')
      } else {
        const { error } = await supabase
          .from('employees')
          .insert(employeeForm)
        if (error) throw error
        toast.success('Employee added')
      }
      
      setEmployeeDialogOpen(false)
      setEditingEmployee(null)
      setEmployeeForm({ name: '', designation: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error('Failed to save employee')
    }
  }

  const toggleEmployeeStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: !active })
        .eq('id', id)
      
      if (error) throw error
      toast.success(active ? 'Employee disabled' : 'Employee enabled')
      fetchData()
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('Failed to update employee')
    }
  }

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('expense_categories')
          .update(categoryForm)
          .eq('id', editingCategory.id)
        if (error) throw error
        toast.success('Category updated')
      } else {
        const { error } = await supabase
          .from('expense_categories')
          .insert(categoryForm)
        if (error) throw error
        toast.success('Category added')
      }
      
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({ name: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving category:', error)
      const message = error instanceof Error ? error.message : 'Failed to save category'
      toast.error(message)
    }
  }

  const toggleCategoryStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ active: !active })
        .eq('id', id)
      
      if (error) throw error
      toast.success(active ? 'Category disabled' : 'Category enabled')
      fetchData()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12 text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Manage company details, employees, and expense categories</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">Company Details</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="categories">Expense Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={companyForm.brand_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, brand_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="office_address">Office Address</Label>
                <Textarea
                  id="office_address"
                  value={companyForm.office_address}
                  onChange={(e) => setCompanyForm({ ...companyForm, office_address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voucher Number Format</Label>
                <Input value={settings?.voucher_prefix + '/{YEAR}/{NUMBER}'} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Example: PWM/EXP/2026/0001</p>
              </div>

              <Button onClick={saveCompanySettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employees</CardTitle>
              <Button
                onClick={() => {
                  setEditingEmployee(null)
                  setEmployeeForm({ name: '', designation: '' })
                  setEmployeeDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
              <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp_name">Name</Label>
                      <Input
                        id="emp_name"
                        value={employeeForm.name}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp_designation">Designation</Label>
                      <Input
                        id="emp_designation"
                        value={employeeForm.designation}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                      />
                    </div>
                    <Button onClick={saveEmployee} disabled={!employeeForm.name}>
                      {editingEmployee ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.designation || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={emp.active ? 'default' : 'secondary'}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEmployee(emp)
                            setEmployeeForm({ name: emp.name, designation: emp.designation || '' })
                            setEmployeeDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEmployeeStatus(emp.id, emp.active)}
                        >
                          {emp.active ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense Categories</CardTitle>
              <Button
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '' })
                  setCategoryDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat_name">Category Name</Label>
                      <Input
                        id="cat_name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      />
                    </div>
                    <Button onClick={saveCategory} disabled={!categoryForm.name}>
                      {editingCategory ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        <Badge variant={cat.active ? 'default' : 'secondary'}>
                          {cat.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(cat)
                            setCategoryForm({ name: cat.name })
                            setCategoryDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCategoryStatus(cat.id, cat.active)}
                        >
                          {cat.active ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
