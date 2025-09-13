
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using EventOrganizerAPI.DTOs.Enums;

namespace EventOrganizerAPI.Services
{
    public class EnumsService : Interfaces.IEnumsService
    {
        private readonly Assembly _assembly;
        private readonly string _enumsNamespace;

        /// <param name="enumsNamespace">npr. "EventOrganizerAPI.Models.Enums"</param>
        public EnumsService(string? enumsNamespace = null)
        {
            _assembly = Assembly.GetExecutingAssembly();
            _enumsNamespace = string.IsNullOrWhiteSpace(enumsNamespace) ? "EventOrganizerAPI.Models.Enums" : enumsNamespace!;
        }

        private IEnumerable<Type> GetEnumTypes()
        {
            return _assembly
                .GetTypes()
                .Where(t => t.IsEnum && t.Namespace != null && t.Namespace.StartsWith(_enumsNamespace, StringComparison.Ordinal));
        }

        public List<string> GetEnumNames()
        {
            return GetEnumTypes().Select(t => t.Name).OrderBy(n => n).ToList();
        }

        public EnumResponseDto GetEnum(string enumName)
        {
            if (string.IsNullOrWhiteSpace(enumName))
                return new EnumResponseDto { EnumName = enumName ?? string.Empty, Values = new List<EnumValueDto>() };

            var type = GetEnumTypes().FirstOrDefault(t => string.Equals(t.Name, enumName, StringComparison.OrdinalIgnoreCase));
            if (type == null)
                return new EnumResponseDto { EnumName = enumName, Values = new List<EnumValueDto>() };

            var names = Enum.GetNames(type);
            var values = Enum.GetValues(type).Cast<object>().Select(Convert.ToInt32).ToArray();

            var list = new List<EnumValueDto>();
            for (int i = 0; i < names.Length; i++)
                list.Add(new EnumValueDto { Name = names[i], Value = values[i] });

            return new EnumResponseDto { EnumName = type.Name, Values = list };
        }

        public AllEnumsResponseDto GetAllEnums()
        {
            var result = new AllEnumsResponseDto();
            foreach (var type in GetEnumTypes())
            {
                var names = Enum.GetNames(type);
                var values = Enum.GetValues(type).Cast<object>().Select(Convert.ToInt32).ToArray();

                var list = new List<EnumValueDto>();
                for (int i = 0; i < names.Length; i++)
                    list.Add(new EnumValueDto { Name = names[i], Value = values[i] });

                result.Enums[type.Name] = list;
            }
            return result;
        }
    }
}
