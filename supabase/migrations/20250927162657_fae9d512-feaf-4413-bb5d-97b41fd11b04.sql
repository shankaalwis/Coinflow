-- Create custom types
CREATE TYPE transaction_type AS ENUM ('CASH_IN', 'CASH_OUT');

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashbooks table
CREATE TABLE public.cashbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Create modes table
CREATE TABLE public.modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cashbook_id UUID NOT NULL REFERENCES public.cashbooks(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  mode_id UUID NOT NULL REFERENCES public.modes(id),
  transaction_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_cashbook_datetime ON public.transactions(cashbook_id, transaction_datetime DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_mode ON public.transactions(mode_id);
CREATE INDEX idx_transactions_user ON public.transactions(recorded_by_user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for cashbooks
CREATE POLICY "Users can view their own cashbooks" ON public.cashbooks
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own cashbooks" ON public.cashbooks
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own cashbooks" ON public.cashbooks
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own cashbooks" ON public.cashbooks
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for categories
CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for modes
CREATE POLICY "Users can view their own modes" ON public.modes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own modes" ON public.modes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own modes" ON public.modes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own modes" ON public.modes
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view transactions from their cashbooks" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cashbooks 
      WHERE cashbooks.id = transactions.cashbook_id 
      AND cashbooks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions to their cashbooks" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = recorded_by_user_id AND
    EXISTS (
      SELECT 1 FROM public.cashbooks 
      WHERE cashbooks.id = transactions.cashbook_id 
      AND cashbooks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions in their cashbooks" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cashbooks 
      WHERE cashbooks.id = transactions.cashbook_id 
      AND cashbooks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions from their cashbooks" ON public.transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cashbooks 
      WHERE cashbooks.id = transactions.cashbook_id 
      AND cashbooks.owner_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cashbooks_updated_at
  BEFORE UPDATE ON public.cashbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modes_updated_at
  BEFORE UPDATE ON public.modes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert default categories
  INSERT INTO public.categories (name, owner_id) VALUES
    ('Groceries', NEW.id),
    ('Rent', NEW.id),
    ('Utilities', NEW.id),
    ('Salary', NEW.id),
    ('Sales', NEW.id);
  
  -- Insert default modes
  INSERT INTO public.modes (name, owner_id) VALUES
    ('Cash', NEW.id),
    ('Bank Transfer', NEW.id),
    ('Card', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user setup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();