'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  Download,
  Upload
} from 'lucide-react';

interface Rule {
  id: number;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: Partial<Rule>) => {
    try {
      const response = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        await fetchRules();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async (id: number, updates: Partial<Rule>) => {
    try {
      const response = await fetch(`/api/admin/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/admin/rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleRule = async (id: number, enabled: boolean) => {
    await handleUpdateRule(id, { enabled });
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || rule.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rule Management</h2>
          <p className="text-gray-600">Create and manage compatibility check rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateRuleForm onSubmit={handleCreateRule} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Rules</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security_tool">Security Tool</SelectItem>
                  <SelectItem value="framework">Framework</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Compatibility Rules ({filteredRules.length})</span>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {rules.filter(r => r.enabled).length} Active
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                {rules.filter(r => !r.enabled).length} Inactive
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading rules...
                    </TableCell>
                  </TableRow>
                ) : filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No rules found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          {rule.enabled ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{rule.usageCount} scans</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(rule.pattern)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl">
            <EditRuleForm
              rule={editingRule}
              onSubmit={(updates) => handleUpdateRule(editingRule.id, updates)}
              onCancel={() => setEditingRule(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateRuleForm({ onSubmit }: { onSubmit: (data: Partial<Rule>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    severity: 'medium' as const,
    pattern: '',
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Rule</DialogTitle>
        <DialogDescription>
          Define a new compatibility check rule for the analysis engine.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Docker Container Security"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="security_tool">Security Tool</SelectItem>
                <SelectItem value="framework">Framework</SelectItem>
                <SelectItem value="library">Library</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this rule checks for..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="severity">Severity Level</Label>
            <Select 
              value={formData.severity} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="enabled">Enable rule immediately</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="pattern">Pattern/Logic</Label>
          <Textarea
            id="pattern"
            value={formData.pattern}
            onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
            placeholder="Define the rule pattern (JSON, regex, or logic expression)..."
            rows={4}
            className="font-mono text-sm"
            required
          />
        </div>

        <DialogFooter>
          <Button type="submit">Create Rule</Button>
        </DialogFooter>
      </form>
    </>
  );
}

function EditRuleForm({ 
  rule, 
  onSubmit, 
  onCancel 
}: { 
  rule: Rule; 
  onSubmit: (updates: Partial<Rule>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: rule.name,
    description: rule.description,
    category: rule.category,
    severity: rule.severity,
    pattern: rule.pattern,
    enabled: rule.enabled,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Rule</DialogTitle>
        <DialogDescription>
          Modify the compatibility check rule configuration.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-name">Rule Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="security_tool">Security Tool</SelectItem>
                <SelectItem value="framework">Framework</SelectItem>
                <SelectItem value="library">Library</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-severity">Severity Level</Label>
            <Select 
              value={formData.severity} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="edit-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="edit-enabled">Rule enabled</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="edit-pattern">Pattern/Logic</Label>
          <Textarea
            id="edit-pattern"
            value={formData.pattern}
            onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
            rows={4}
            className="font-mono text-sm"
            required
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update Rule</Button>
        </DialogFooter>
      </form>
    </>
  );
}