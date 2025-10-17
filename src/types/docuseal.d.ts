declare namespace DocuSeal {
  interface Template {
    id: number;
    name: string;
    external_id?: string | null;
    folder_name?: string;
    created_at: string;
    updated_at: string;
  }

  interface SubmitterValue {
    field: string;
    value: string | number | boolean;
  }

  interface SubmitterDocument {
    name: string;
    url: string;
  }

  interface SubmitterPreferences {
    send_email?: boolean;
    send_sms?: boolean;
    reply_to?: string;
    completed_redirect_url?: string;
  }

  interface Submitter {
    id: number;
    submission_id: number;
    uuid: string;
    email: string;
    slug: string;
    sent_at: string | null;
    opened_at: string | null;
    completed_at: string | null;
    declined_at: string | null;
    created_at: string;
    updated_at: string;
    name: string;
    phone?: string;
    external_id?: string | null;
    status: 'sent' | 'opened' | 'completed' | 'declined';
    role?: string;
    metadata?: Record<string, any>;
    preferences?: SubmitterPreferences;
    values?: SubmitterValue[];
    documents?: SubmitterDocument[];
    embed_src?: string;
  }

  interface SubmissionEvent {
    id: number;
    submitter_id: number;
    event_type: string;
    event_timestamp: string;
  }

  interface SubmissionDocument {
    name: string;
    url: string;
  }

  interface CreatedByUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  }

  interface SchemaItem {
    name: string;
    attachment_uuid: string;
  }

  interface FieldArea {
    page: number;
    attachment_uuid: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }

  interface Field {
    name: string;
    type: string;
    required?: boolean;
    uuid: string;
    submitter_uuid: string;
    areas: FieldArea[];
  }

  interface Submission {
    id: number;
    name?: string | null;
    source: string;
    submitters_order: string;
    slug: string;
    status: "pending" | "completed" | "declined" | "expired";
    audit_log_url?: string;
    combined_document_url?: string | null;
    expire_at?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
    archived_at?: string | null;
    submitters: Submitter[];
    template: Template;
    created_by_user?: CreatedByUser;
    submission_events?: SubmissionEvent[];
    documents?: SubmissionDocument[];
    schema?: SchemaItem[];
    fields?: Field[];
  }

  interface Pagination {
    count: number;
    next: number | null;
    prev: number | null;
  }

  interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
  }

  // Request types for creating submissions
  interface SubmitterMessage {
    subject?: string;
    body?: string;
  }

  interface FieldValidation {
    pattern?: string;
    message?: string;
    min?: number | string;
    max?: number | string;
    step?: number;
  }

  interface FieldPreferences {
    font_size?: number;
    font_type?: 'bold' | 'italic' | 'bold_italic';
    font?: 'Times' | 'Helvetica' | 'Courier';
    color?: 'black' | 'white' | 'blue';
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'center' | 'bottom';
    format?: string;
    price?: number;
    currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
    mask?: boolean | number;
  }

  interface FieldConfig {
    name: string;
    default_value?: string | number | boolean | any[];
    readonly?: boolean;
    required?: boolean;
    title?: string;
    description?: string;
    validation?: FieldValidation;
    preferences?: FieldPreferences;
  }

  interface CreateSubmitterRequest {
    name?: string;
    role?: string;
    email: string;
    phone?: string;
    values?: Record<string, any>;
    external_id?: string;
    completed?: boolean;
    metadata?: Record<string, any>;
    send_email?: boolean;
    send_sms?: boolean;
    reply_to?: string;
    completed_redirect_url?: string;
    order?: number;
    require_phone_2fa?: boolean;
    message?: SubmitterMessage;
    fields?: FieldConfig[];
  }

  interface CreateSubmissionRequest {
    template_id: number;
    send_email?: boolean;
    send_sms?: boolean;
    order?: 'preserved' | 'random';
    completed_redirect_url?: string;
    bcc_completed?: string;
    reply_to?: string;
    expire_at?: string;
    message?: SubmitterMessage;
    submitters: CreateSubmitterRequest[];
    fields?: FieldConfig[];
  }
}