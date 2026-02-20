---
layout: post
title: "MySQL on Linux"
date: 2024-04-19 09:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [linux]
tags: [database, mysql]
---

# Install MySQL on Linux

MySQL is one of the most popular open-source relational database management systems.

In this guide, we'll walk you through the steps to install MySQL on Linux.

### Prerequisites

Before you begin, make sure you have:

- A Linux-based operating system
- A user account with sudo privileges

## Step 1: Update Package List

Update the package list to ensure you have the latest information about available packages:

```sh
sudo apt update
```

## Step 2: Install MySQL Server

Run the following command to install MySQL Server:

```sh
sudo apt install mysql-server
```

During installation, you'll be prompted to set a root password for MySQL. Choose a strong password and keep it secure.

If you're not prompted to set a password, set it manually:

```sh
sudo mysql
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
```

## Secure MySQL Installation

MySQL includes a script that helps secure the installation:

```bash
sudo mysql_secure_installation
```

The script guides you through securing MySQL, including setting a root password, removing anonymous users, disallowing remote root login, and removing the test database.

## Useful MySQL Commands

```bash
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl status mysql
```

## Verify MySQL Installation

Log in to the MySQL shell as the root user to verify the installation:

```bash
sudo mysql -u root -p
```

Enter the root password you set during installation. If you can log in without errors, MySQL is installed and running correctly.

## Conclusion

You've successfully installed MySQL on your Linux system. You can now create databases, tables, and manage your data.

If you have any questions, feel free to contact me on [Twitter](https://twitter.com/juanvqz_).
