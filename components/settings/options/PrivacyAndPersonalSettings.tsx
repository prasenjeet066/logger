"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/loader/spinner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function PrivacyAndPersonalSettings() {
  const [currentUser, setCurrentUser] = useState < object > (null)
  const [Errors, setErrors] = useState()
  const [formValues, setFormValues] = useState < Record < string, boolean > | null > (null)
  const [submiting , setSubmiting] = useState(false)
  // Define all settings with sections
  const settingsSections = [
  {
    title: "Privacy",
    items: [
    {
      label: "Lock your profile",
      description: "Only approved followers can see your full profile details.",
      id: "lock_profile",
      default: false,
    },
    {
      label: "Hide your following list",
      description: "Others won’t be able to see who you are following.",
      id: "hide_following_list",
      default: false,
    },
    {
      label: "Show activity status",
      description: "Let others see when you’re active or last active on the platform.",
      id: "show_activity_status",
      default: true,
    }, ],
  },
  {
    title: "Messaging",
    items: [
    {
      label: "Allow messages from everyone",
      description: "Anyone on the platform can send you a direct message.",
      id: "public_send_message",
      default: true,
    }, ],
  },
  {
    title: "Visibility & Search",
    items: [
    {
      label: "Show profile in search results",
      description: "Allow your profile to appear in platform and external search engines.",
      id: "show_in_search",
      default: true,
    }, ],
  },
  {
    title: "Ads & Personalization",
    items: [
    {
      label: "Personalized ads",
      description: "Receive ads tailored based on your activity and interests.",
      id: "personalized_ads",
      default: true,
    }, ],
  }, ]
  const ids = settingsSections.reduce((acc, section) => {
    section.items.forEach(item => acc.push(item.id));
    return acc;
  }, []);
  
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/users/current');
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          
          const initial = settingsSections.reduce((acc, section) => {
            section.items.forEach((item) => {
              acc[item.id] = {
                id: item.id,
                default: user[item.id] !== undefined ? user[item.id] : false
              };
            });
            return acc;
          }, {} as Record < string, { id: string, default: boolean } > );
          
          setFormValues(initial);
        } else {
          setErrors(res.statusText);
        }
      } catch (error) {
        setErrors(String(error));
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  
  // Toggle switch handler
  const handleToggle = (id: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        default: !prev[id].default
      }
    }));
  };
  
  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmiting(true)
    // Convert to flat object: { lock_profile: true, ... }
    const payload = Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, value.default])
    );
    
    try {
      await fetch('/api/users/profile', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmiting(false)
    } catch (e) {
      setSubmiting(alse)
      setErrors(e)
    }
  };
  if (!formValues) {
    <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    
  };
  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
      {settingsSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-4 border-b pb-4">
          <h3 className="text-lg font-medium">{section.title}</h3>
          {section.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor={item.id}>{item.label}</Label>
                <span className="text-sm text-muted-foreground">{item.description}</span>
              </div>
         
              <Switch
  id={item.id}
  checked={formValues[item.id].default}
  onCheckedChange={() => handleToggle(item.id)}
/>
            </div>
          ))}
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button type="submit">{submiting ? "Loading.." : "Save Change"}</Button>
      </div>
    </form>
  )
}